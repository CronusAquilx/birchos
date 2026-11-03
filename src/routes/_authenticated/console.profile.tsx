import { createFileRoute } from "@tanstack/react-router";
import { consoleCatalogOptions } from "@/lib/console/catalog";
import { ConsoleScreen } from "@/components/console/ConsoleScreen";

export const Route = createFileRoute("/_authenticated/console/profile")({
  loader: ({ context }) => context.queryClient.ensureQueryData(consoleCatalogOptions),
  head: () => ({ meta: [{ title: "Console Profile — BIRCH OS" }, { name: "description", content: "Your BIRCH OS console player profile." }, { property: "og:title", content: "Console Profile — BIRCH OS" }, { property: "og:description", content: "Your BIRCH OS console player profile." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <ConsoleScreen screen="profile" />,
});