import { VISIBLE_LAYOUTS, type AppearanceProfile, type AppearanceProfiles } from "./appearance";

export type AppearancePreset = { id: string; name: string; look: AppearanceProfile };

/** Shared looks never move a layout's independently arranged widgets. */
export function syncAppearance(profiles: AppearanceProfiles, look: AppearanceProfile): AppearanceProfiles {
  const wallpaper = look.customBg || look.consoleCustomBg;
  return Object.fromEntries(VISIBLE_LAYOUTS.map(layout => [layout, {
    ...look, customBg: wallpaper, consoleCustomBg: wallpaper,
    consoleBg: wallpaper ? "custom" : look.consoleBg,
    desktopWidgets: profiles[layout]?.desktopWidgets,
  }]));
}

export function mergePreset(presets: AppearancePreset[], preset: AppearancePreset) {
  return [...presets.filter(item => item.id !== preset.id), preset];
}