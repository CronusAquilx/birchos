import { describe, expect, it } from "vitest";
import { VISIBLE_LAYOUTS, initialAppearance, updateAppearance } from "./appearance";
import { DEFAULT_PREFS } from "./prefs";
import { filterWallpapers, wallpaperPatch, type CatalogWallpaper } from "./wallpaper-catalog";

const item: CatalogWallpaper = { id: "lake", title: "Dreamy Landscape", source: "https://www.desktophut.com/lake", video: "/loop.mp4", image: "/lake.jpg", resolution: "3840x2160" };
describe("shared live wallpaper catalog", () => {
  it.each(VISIBLE_LAYOUTS)("applies a video to %s without changing another layout", layout => {
    const current = initialAppearance(DEFAULT_PREFS);
    const saved = updateAppearance({ classic: current }, layout, current, wallpaperPatch(layout, item));
    expect(saved[layout]?.wallpaperType).toBe("video");
    expect(saved[layout]?.wallpaperPlayback).toBe(true);
    expect(saved[layout]?.wallpaperPoster).toBe("/lake.jpg");
    expect(["sony", "series", "wii", "neutral"].includes(layout) ? saved[layout]?.consoleCustomBg : saved[layout]?.customBg).toBe("/loop.mp4");
    expect(saved.classic?.customBg).toBe(current.customBg);
  });
  it("searches titles and resolutions without case sensitivity", () => {
    expect(filterWallpapers([item], "DREAMY 3840")).toEqual([item]);
    expect(filterWallpapers([item], "naruto")).toEqual([]);
  });
});