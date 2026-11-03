import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { visitDestination } from "@/lib/console/visit";
import { usePrefs } from "@/lib/astra/prefs";
import { AstraMark } from "@/components/astra/Mark";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BIRCH OS — a desktop environment in your browser" },
      { name: "description", content: "BIRCH OS is a browser-based desktop environment: choose a layout, manage windows and apps, and shape every detail of your shell through system settings and personalization presets." },
      { property: "og:title", content: "BIRCH OS — a desktop environment in your browser" },
      { property: "og:description", content: "A browser-based desktop shell with window and app management, system settings, and saved personalization presets." },
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
