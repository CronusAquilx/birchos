// Node HTTP upgrade handling for /api/live and /api/proxy-ws.
// Shared by the Vite dev server plugin and the Render Node server so both
// runtimes use the same auth, origin checks, cleanup and backpressure rules.
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import type { TLSSocket } from "node:tls";

import WebSocket, { WebSocketServer } from "ws";

import type { LiveConnector, LiveSocket } from "../src/lib/live-relay.server";

type RelayModule = typeof import("../src/lib/live-relay.server");
type AuthModule = typeof import("../src/lib/astra/api-user.server");

export type UpgradeLoaders = {
  loadRelay: () => Promise<RelayModule>;
  loadAuth: () => Promise<AuthModule>;
  /** Dev preview has no Origin on some tooling clients; production requires it. */
  allowMissingOrigin?: boolean;
};

const MAX_PAYLOAD = 5 * 1024 * 1024;
const LIVE_BUFFER_LIMIT = 256 * 1024;
const PROXY_BUFFER_LIMIT = 4 * 1024 * 1024;
const PROXY_QUEUE_LIMIT = 256;

export function liveSocket(socket: WebSocket): LiveSocket {
  return {
    get readyState() {
      return socket.readyState;
    },
    send(data) {
      if (socket.bufferedAmount > LIVE_BUFFER_LIMIT) throw new Error("Voice connection is too slow");
      socket.send(data);
    },
    close(code = 1000, reason) {
      if (socket.readyState !== WebSocket.OPEN) return socket.terminate();
      socket.close(code, reason);
      const timer = setTimeout(() => socket.terminate(), 1000);
      timer.unref();
      socket.once("close", () => clearTimeout(timer));
    },
    onMessage(handler) {
      socket.on("message", (data, binary) => handler(binary ? data : data.toString()));
    },
    onClose(handler) {
      socket.on("close", handler);
    },
    onError(handler) {
      socket.on("error", handler);
    },
  };
}

export const connectGateway: LiveConnector = (address, headers, signal) =>
  new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const url = new URL(address);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(url, {
      headers,
      handshakeTimeout: 10_000,
      maxPayload: MAX_PAYLOAD,
      followRedirects: false,
      perMessageDeflate: false,
    });
    const abort = () => {
      socket.terminate();
      reject(new Error("Voice connection cancelled"));
    };
    signal.addEventListener("abort", abort, { once: true });
    socket.once("close", () => signal.removeEventListener("abort", abort));
    socket.on("error", () => reject(new Error("Voice gateway connection failed")));
    socket.once("unexpected-response", (_request, response) => {
      let body = "";
      const rejectWithBody = () => {
        socket.terminate();
        let message = "";
        try {
          const parsed = JSON.parse(body) as { message?: unknown };
          if (typeof parsed.message === "string") message = parsed.message.slice(0, 300);
        } catch {
          message = "";
        }
        reject(new Error(message || `Voice gateway rejected the connection (${response.statusCode})`));
      };
      response.setEncoding("utf8");
      response.on("data", (chunk: string) => {
        if (body.length < 16 * 1024) body += chunk;
      });
      response.once("end", rejectWithBody);
      response.once("error", rejectWithBody);
    });
    socket.once("open", () => {
      if (signal.aborted) return abort();
      resolve(liveSocket(socket));
    });
  });

export function upgradeRequest(request: IncomingMessage, trustProxy = false): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      headers.append(name, item);
    }
  }
  const host = request.headers.host;
  if (!host) throw new Error("Missing request host");
  const forwarded = trustProxy ? String(request.headers["x-forwarded-proto"] ?? "").split(",")[0]?.trim() : "";
  const protocol = forwarded === "https" || (request.socket as TLSSocket).encrypted ? "https:" : "http:";
  const origin = new URL(`${protocol}//${host}`).origin;
  const url = new URL(request.url ?? "/", origin);
  if (url.origin !== origin) throw new Error("Invalid request URL");
  return new Request(url, { method: request.method ?? "GET", headers });
}

export function rejectUpgrade(socket: Duplex, status: number) {
  if (!socket.destroyed) {
    socket.end(`HTTP/1.1 ${status} Connection rejected\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
  }
}

const safeCode = (c?: number) => (c && c >= 1000 && c < 5000 && c !== 1005 && c !== 1006 ? c : 1000);

function bridgeProxy(browser: WebSocket, target: string, protocols: string[], origin: string) {
  const up = new WebSocket(target, protocols, {
    headers: { origin, "user-agent": "Mozilla/5.0" },
    handshakeTimeout: 15_000,
    maxPayload: MAX_PAYLOAD,
  });
  const queue: [WebSocket.RawData, boolean][] = [];
  let closed = false;
  const end = (code?: number, reason?: Buffer | string) => {
    if (closed) return;
    closed = true;
    try { browser.close(safeCode(code), String(reason ?? "").slice(0, 120)); } catch { browser.terminate(); }
    try { up.readyState === WebSocket.CONNECTING ? up.terminate() : up.close(); } catch { up.terminate(); }
  };
  // Backpressure: a peer that can't drain its buffer gets disconnected instead of growing memory.
  const forward = (to: WebSocket, data: WebSocket.RawData, binary: boolean) => {
    if (to.bufferedAmount > PROXY_BUFFER_LIMIT) return end(1013, "Connection too slow");
    to.send(data, { binary });
  };
  browser.on("message", (d, bin) => {
    if (up.readyState === WebSocket.OPEN) return forward(up, d, bin);
    if (queue.length >= PROXY_QUEUE_LIMIT) return end(1013, "Too many queued messages");
    queue.push([d, bin]);
  });
  up.on("open", () => {
    browser.send(JSON.stringify({ __astra: "open", protocol: up.protocol }));
    for (const [d, b] of queue.splice(0)) forward(up, d, b);
  });
  up.on("message", (d, bin) => forward(browser, d, bin));
  up.on("close", (c, r) => end(c, r));
  up.on("error", () => end(1011, "upstream error"));
  up.on("unexpected-response", () => end(1011, "Upstream refused"));
  browser.on("close", () => end());
  browser.on("error", () => end(1011));
}

/** Returns an `upgrade` listener; it ignores paths it doesn't own so other handlers (Vite HMR) still work. */
export function createUpgradeHandler(loaders: UpgradeLoaders & { trustProxy?: boolean }) {
  const sockets = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD });

  const handle = (request: IncomingMessage, socket: Duplex, head: Buffer): boolean => {
    const path = request.url?.split("?", 1)[0];
    if (path !== "/api/live" && path !== "/api/proxy-ws") return false;
    socket.on("error", () => {});
    const timer = setTimeout(() => socket.destroy(), 10_000);
    timer.unref();
    const params = new URL(request.url ?? "/", "http://localhost").searchParams;
    const token = params.get("token") ?? "";

    void (async () => {
      try {
        const auth = await loaders.loadAuth();
        const user = await auth.authenticateRequest(new Request("http://localhost/", { headers: { authorization: `Bearer ${token}` } }));
        if (!user) return rejectUpgrade(socket, 401);

        if (path === "/api/proxy-ws") {
          const target = params.get("url") ?? "";
          if (!/^wss?:\/\//i.test(target)) return rejectUpgrade(socket, 400);
          const protocols = (params.get("protocols") ?? "").split(",").filter(Boolean);
          const origin = params.get("origin") ?? new URL(target.replace(/^ws/i, "http")).origin;
          if (socket.destroyed) return;
          sockets.handleUpgrade(request, socket, head, (browser) => bridgeProxy(browser, target, protocols, origin));
          return;
        }

        const relay = await loaders.loadRelay();
        const config = relay.getLiveConfig();
        const rejection = relay.validateLiveUpgrade(upgradeRequest(request, loaders.trustProxy), {
          allowMissingOrigin: loaders.allowMissingOrigin ?? false,
        });
        if (rejection) return rejectUpgrade(socket, rejection.status);
        if (socket.destroyed) return;
        sockets.handleUpgrade(request, socket, head, (connection) => {
          const browser = liveSocket(connection);
          relay.bindLiveConnection(
            browser,
            config,
            { waitUntil(task) { void task.catch(() => browser.close(1011, "Voice processing failed")); } },
            connectGateway,
            token || undefined,
          );
        });
      } catch {
        rejectUpgrade(socket, 503);
      } finally {
        clearTimeout(timer);
      }
    })();
    return true;
  };

  const close = () => {
    for (const client of sockets.clients) client.terminate();
    sockets.close();
  };
  return { handle, close };
}
