import type { Plugin } from "vite";

import { createUpgradeHandler } from "./node/ws-upgrade";

/** Dev preview WebSocket support for /api/live and /api/proxy-ws (same code path as the Render Node server). */
export function liveVoiceDev(): Plugin {
  let dispose = () => {};
  return {
    name: "live-voice-dev",
    apply: "serve",
    configureServer(server) {
      const httpServer = server.httpServer;
      if (!httpServer) throw new Error("Live voice preview requires Vite's HTTP server");
      const upgrades = createUpgradeHandler({
        allowMissingOrigin: true,
        loadAuth: () => server.ssrLoadModule("/src/lib/astra/api-user.server.ts") as never,
        loadRelay: () => server.ssrLoadModule("/src/lib/live-relay.server.ts") as never,
      });
      const listener = (req: Parameters<typeof upgrades.handle>[0], socket: Parameters<typeof upgrades.handle>[1], head: Buffer) => {
        upgrades.handle(req, socket, head);
      };
      let disposed = false;
      httpServer.on("upgrade", listener);
      dispose = () => {
        if (disposed) return;
        disposed = true;
        httpServer.off("upgrade", listener);
        upgrades.close();
      };
      httpServer.once("close", dispose);
    },
    closeBundle() {
      dispose();
    },
  };
}
