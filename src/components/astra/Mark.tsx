import { cn } from "@/lib/utils";
import logo from "@/assets/birch-os-logo.png.asset.json";

/** BirchBlock's mark: a four-point star. */
export function AstraMark({ className, pulsing }: { className?: string; pulsing?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("text-star", pulsing && "animate-twinkle", className)}>
      <path fill="currentColor" d="M12 1.5c.6 5.4 3.6 9.6 10.5 10.5-6.9.9-9.9 5.1-10.5 10.5C11.4 17.1 8.4 12.9 1.5 12 8.4 11.1 11.4 6.9 12 1.5Z" />
    </svg>
  );
}

export function AstraWordmark({ className }: { className?: string }) {
  return (
    <img src={logo.url} alt="BIRCH OS" className={cn("h-16 w-24 rounded object-cover", className)} />
  );
}
