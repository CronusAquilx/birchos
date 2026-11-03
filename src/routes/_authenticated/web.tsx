import { createFileRoute } from "@tanstack/react-router";
import { WebView } from "@/components/windows/views/WebView";

export const Route = createFileRoute("/_authenticated/web")({
  head: () => ({ meta: [{ title: "Web \u2014 BIRCH OS" }, { name: "description", content: "Search and browse websites inside BIRCH OS." }, { property: "og:title", content: "Web \u2014 BIRCH OS" }, { property: "og:description", content: "Search and browse websites inside BIRCH OS." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  validateSearch: (s: Record<string, unknown>): { q?: string } => (typeof s["q"] === "string" && s["q"] ? { q: s["q"] } : {}),
  component: WebRoute,
});

function WebRoute() { const { q } = Route.useSearch(); return <WebView initialQ={q}/>; }
