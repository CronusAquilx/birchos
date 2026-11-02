import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { visitDestination } from "@/lib/console/visit";
import { usePrefs } from "@/lib/astra/prefs";
import { AstraMark } from "@/components/astra/Mark";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BIRCH OS — Your personal space" },
      { name: "description", content: "Choose your layout and saved look, then enjoy movies, games and music in BIRCH OS." },
      { property: "og:title", content: "BIRCH OS — Your personal space" },
      { property: "og:description", content: "Choose your layout and saved look, then enjoy movies, games and music in BIRCH OS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { session, loading, guest } = useAuth();
  const p = usePrefs();
  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center sky">
        <AstraMark className="size-8" pulsing />
      </div>
    );
  return <Navigate to={session || guest ? visitDestination(p) : "/auth"} replace />;
}
