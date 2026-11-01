import { useEffect, useRef } from "react";
import { usePrefs } from "@/lib/astra/prefs";

/** Shared silent wallpaper playback; never used by standalone gameplay. */
export function WallpaperMedia({ src, type, poster, className, reduceMotion = false }: {
  src: string; type?: "image" | "video" | undefined; poster?: string | undefined; className?: string; reduceMotion?: boolean;
}) {
  const prefs = usePrefs();
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const node = video.current;
    if (!node) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (reduceMotion || prefs.perfMode || motion.matches || document.hidden) node.pause();
      else void node.play().catch(() => {});
    };
    update();
    document.addEventListener("visibilitychange", update);
    motion.addEventListener("change", update);
    return () => { node.pause(); document.removeEventListener("visibilitychange", update); motion.removeEventListener("change", update); };
  }, [src, type, reduceMotion, prefs.perfMode]);
  return type === "video"
    ? <video ref={video} key={src} src={src} poster={poster} muted loop playsInline preload="metadata" aria-hidden="true" className={className}/>
    : <img src={src} alt="" width={1920} height={1080} className={className}/>;
}