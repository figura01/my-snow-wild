import { cn } from "@/lib/utils";

// Logo Snow Wild (piste « Double sommet ») : symbole SVG + nom en texte réel.
// tone="light" sur fond clair, tone="dark" sur fond sombre (symbole inversé).
export function LogoMark({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  const tile = tone === "light" ? "#1d63d6" : "#ffffff";
  const peaks = tone === "light" ? "#ffffff" : "#1d63d6";
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill={tile} />
      <path d="M8 48 L23 25 L31 36 L41 18 L56 48 Z" fill={peaks} />
      <path d="M41 18 L46.5 28 L43.5 26.5 L41 29.5 L38.5 26.5 L35.8 27.5 Z" fill="#bfdbfe" />
    </svg>
  );
}

export function Logo({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark tone={tone} className="h-8 w-8 shrink-0" />
      <span className="font-logo text-lg font-extrabold tracking-[-0.03em]">
        SNOW<span className={tone === "light" ? "text-glacier" : "text-sky-300"}>WILD</span>
      </span>
    </span>
  );
}
