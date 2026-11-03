import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/astra/AuthPage";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — BIRCH OS" },
      { name: "description", content: "Sign in to BIRCH OS, your browser-based desktop environment." },
      { property: "og:title", content: "Sign in — BIRCH OS" },
      { property: "og:description", content: "Sign in to BIRCH OS, your browser-based desktop environment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

