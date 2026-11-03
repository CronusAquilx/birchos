import { createFileRoute } from "@tanstack/react-router";
import { GamesView } from "@/components/windows/views/GamesView";

export const Route = createFileRoute("/_authenticated/games")({
  head: () => ({ meta: [{ title: "Games — BIRCH OS" }, { name: "description", content: "Play browser games and connect to cloud gaming services in BIRCH OS." }, { property: "og:title", content: "Games — BIRCH OS" }, { property: "og:description", content: "Browse and play BIRCH OS's arcade and cloud game library." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: GamesView,
});
