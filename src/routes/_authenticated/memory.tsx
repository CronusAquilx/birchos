import { createFileRoute } from "@tanstack/react-router";
import { MemoryView } from "@/components/windows/views/MemoryView";

export const Route = createFileRoute("/_authenticated/memory")({
  head: () => ({ meta: [{ title: "Memory \u2014 BIRCH OS" }, { name: "description", content: "Manage the personal facts BIRCH OS remembers for your conversations." }, { property: "og:title", content: "Memory \u2014 BIRCH OS" }, { property: "og:description", content: "Manage the personal facts BIRCH OS remembers for your conversations." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: MemoryView,
});
