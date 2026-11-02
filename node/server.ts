// Render / Node entry: serves the Nitro node-middleware build and handles WebSocket upgrades.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { createUpgradeHandler } from "./ws-upgrade";
import * as relay from "../src/lib/live-relay.server";
import * as auth from "../src/lib/astra/api-user.server";

type NodeHandler = (req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse) => unknown;

const root = fileURLToPath(new URL("../.output", import.meta.url));
const publicDir = join(root, "public");
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

const types: Record<string, string> = {
  ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".html": "text/html; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".ico": "image/x-icon", ".wasm": "application/wasm", ".woff2": "font/woff2", ".mp4": "video/mp4", ".txt": "text/plain",
};

async function serveStatic(pathname: string, res: import("node:http").ServerResponse): Promise<boolean> {
  if (pathname === "/" || pathname.includes("\0")) return false;
  const file = normalize(join(publicDir, decodeURIComponent(pathname)));
  if (!file.startsWith(publicDir)) return false;
  try {
    const info = await stat(file);
    if (!info.isFile()) return false;
    res.writeHead(200, {
      "content-type": types[extname(file)] ?? "application/octet-stream",
      "content-length": info.size,
      "cache-control": pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate",
    });
    res.end(await readFile(file));
    return true;
  } catch {
    return false;
  }
}

const { middleware } = (await import(/* @vite-ignore */ join(root, "server/index.mjs"))) as { middleware: NodeHandler };

const upgrades = createUpgradeHandler({
  trustProxy: true,
  loadAuth: async () => auth,
  loadRelay: async () => relay,
});

const server = createServer(async (req, res) => {
  const pathname = (req.url ?? "/").split("?", 1)[0];
  if (pathname === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain" });
    return res.end("ok");
  }
  if ((req.method === "GET" || req.method === "HEAD") && (await serveStatic(pathname, res))) return;
  try {
    await middleware(req, res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) res.writeHead(500, { "content-type": "text/plain" });
    res.end("Internal Server Error");
  }
});

server.on("upgrade", (req, socket, head) => {
  if (!upgrades.handle(req, socket, head)) socket.destroy();
});

server.listen(port, host, () => console.log(`Listening on http://${host}:${port}`));

const shutdown = () => {
  upgrades.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 10_000).unref();
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
