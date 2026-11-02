import { useEffect, useRef } from "react";
import { getAppearance, usePrefs } from "@/lib/astra/prefs";

/** A single lightweight canvas per shell; never mounted by standalone gameplay. */
export function WallpaperEffects({ appearance }: { appearance?: ReturnType<typeof getAppearance> }) {
  const prefs = usePrefs();
  const look = appearance ?? getAppearance(prefs);
  const canvas = useRef<HTMLCanvasElement>(null);
  const enabled = (look.particles !== "off" || look.liveWallpaper !== "off") && !look.reduceMotion && !prefs.perfMode && prefs.device !== "phone";
  useEffect(() => {
    const node = canvas.current;
    if (!node || !enabled) return;
    const ctx = node.getContext("2d");
    if (!ctx) return;
    let frame = 0; let previous = 0;
    const resize = () => { const dpr = Math.min(window.devicePixelRatio || 1, 2); node.width = node.clientWidth * dpr; node.height = node.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const observer = new ResizeObserver(resize); observer.observe(node); resize();
    const tokens = getComputedStyle(node);
    const color = tokens.getPropertyValue("--effect-light").trim();
    const shade = tokens.getPropertyValue("--effect-shadow").trim();
    const points = Array.from({ length: look.particleDensity === "subtle" ? 24 : 64 }, (_, i) => ({ x: ((i * 73) % 101) / 101, y: ((i * 47) % 103) / 103, speed: 0.008 + (i % 5) * 0.003 }));
    const draw = (time: number) => {
      frame = requestAnimationFrame(draw);
      if (time - previous < 33 || document.hidden) return;
      const delta = Math.min((time - previous) / 1000, 0.05) * (look.effectSpeed ?? 1); previous = time;
      const width = node.clientWidth; const height = node.clientHeight;
      ctx.clearRect(0, 0, width, height); ctx.fillStyle = color; ctx.strokeStyle = color;
      if (look.particles === "raindrops") {
        points.forEach((p, i) => {
          const radius = 3 + i % 7;
          p.y += (i % 4 === 0 ? .05 : .002) * delta;
          if (p.y > 1.04) p.y = -.04;
          const x = p.x * width; const y = p.y * height;
          ctx.globalAlpha = .65;
          const glass = ctx.createRadialGradient(x - radius * .3, y - radius * .35, .1, x, y, radius);
          glass.addColorStop(0, color); glass.addColorStop(.25, "transparent"); glass.addColorStop(.75, "transparent"); glass.addColorStop(1, shade);
          ctx.fillStyle = glass; ctx.beginPath(); ctx.ellipse(x, y, radius, radius * 1.3, -.15, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = color; ctx.lineWidth = .7; ctx.globalAlpha = .35;
          ctx.beginPath(); ctx.ellipse(x - radius * .1, y - radius * .2, radius * .7, radius, 0, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
          if (i % 4 === 0) { ctx.globalAlpha = .12; ctx.beginPath(); ctx.moveTo(x, y - radius); ctx.bezierCurveTo(x + 2, y - 20, x - 3, y - 36, x + 1, y - 60); ctx.stroke(); }
        });
        return;
      }
      if (look.particles === "shooting-stars") {
        for (let i = 0; i < 3; i++) {
          const progress = (time * (look.effectSpeed ?? 1) / 6500 + i * .37) % 1;
          if (progress > .3) continue;
          const x = (1 - progress * 2.3) * width - i * width * .15;
          const y = progress * height * 1.2 + i * height * .15;
          const tail = ctx.createLinearGradient(x, y, x + 110, y - 65);
          tail.addColorStop(0, color); tail.addColorStop(1, "transparent");
          ctx.strokeStyle = tail; ctx.lineWidth = 1.5; ctx.globalAlpha = Math.sin(progress / .3 * Math.PI);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 110, y - 65); ctx.stroke();
        }
        ctx.strokeStyle = color;
      }
      if (look.liveWallpaper === "water") {
        for (let i = 0; i < 9; i++) {
          const phase = (time / 5500 + i / 9) % 1;
          ctx.globalAlpha = (1 - phase) * .16;
          ctx.beginPath();
          ctx.ellipse(width * (.18 + (i % 4) * .21), height * (.66 + (i % 3) * .1), 12 + phase * width * .2, 2 + phase * 16, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (look.particles === "off") return;
      }
      points.forEach((p, i) => {
        p.y += (look.liveWallpaper === "rain" || look.particles === "rain" ? 18 : look.particles === "snow" ? 1 : -.15) * p.speed * delta; if (p.y < -0.02) p.y = 1.02; if (p.y > 1.02) p.y = -.02;
        const x = p.x * width + Math.sin(time / 5000 + i) * 12; const y = p.y * height;
        ctx.globalAlpha = 0.18 + (i % 3) * 0.12;
        if (look.particles === "rain" || look.liveWallpaper === "rain") { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 18); ctx.stroke(); }
        else if (look.particles === "snow" || look.particles === "fireflies") { ctx.globalAlpha = look.particles === "fireflies" ? .25 + Math.sin(time / 800 + i) * .2 : .45; ctx.beginPath(); ctx.arc(x, y, look.particles === "snow" ? 2 + i % 3 : 2, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.globalAlpha = .2 + (Math.sin(time / 1300 + i * 2) + 1) * .35; ctx.fillStyle = color; const r = i % 4 === 0 ? 4 : 1.2; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill(); }
      });
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [enabled, look.liveWallpaper, look.particles, look.particleDensity, look.accent, look.palette, look.effectSpeed]);
  return enabled ? <canvas ref={canvas} aria-hidden="true" className="wallpaper-effects pointer-events-none absolute inset-0 size-full"/> : null;
}