# Deploying to Render (Node)

The Lovable build (`bun run build`) still targets Cloudflare and is unchanged.
Render uses a separate Node build:

- Build: `bun run build:node` (Nitro `node-middleware` preset + bundles `node/server.ts` to `dist-node/server.mjs`)
- Start: `npm start` (binds `PORT`, default 3000, host `0.0.0.0`)
- Health check: `GET /healthz`
- WebSockets: `/api/live` and `/api/proxy-ws` are handled by a Node `ws` upgrade handler (`node/ws-upgrade.ts`), shared with the dev server. Auth (bearer token), origin check, backpressure and cleanup are enforced there.

`render.yaml` + `Dockerfile` (Node 22) are provided. `VITE_*` values are needed at **build** time (Docker build args / Render env).

## Required environment variable names (supply values yourself)

| Name | Used for |
|---|---|
| VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID | Browser backend client (build time) |
| SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY | Server auth for API routes and WebSockets |
| SUPABASE_SERVICE_ROLE_KEY | Privileged server tasks (not obtainable from Lovable Cloud) |
| LOVABLE_API_KEY | AI chat / voice relay via Lovable AI gateway (only works for Lovable-hosted usage; replace with your own provider otherwise) |
| ADMIN_ACCESS_CODE | Developer PIN sign-in |
| GOOGLE_API_KEY, UDC_QAISIFY_YOUTUBE_API_KEY | YouTube music search |
| PIPED_INSTANCES, SAAVN_API | Music fallbacks |
| LOVABLE_CRON_SECRET (+ optional LOVABLE_CRON_SECRET_PREVIOUS) | Scheduled endpoint auth |
