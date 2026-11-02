import { createFileRoute } from "@tanstack/react-router";
import { MoviesView } from "@/components/windows/views/MoviesView";

export const Route = createFileRoute("/_authenticated/movies/")({
  head: () => ({ meta: [{ title: "Birch Cinema — Movies and TV" }, { name: "description", content: "Explore trending movies, acclaimed series and your personal watchlist in Birch Cinema." }, { property: "og:title", content: "Birch Cinema — Movies and TV" }, { property: "og:description", content: "Explore trending movies, acclaimed series and your personal watchlist in Birch Cinema." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: MoviesView,
});
