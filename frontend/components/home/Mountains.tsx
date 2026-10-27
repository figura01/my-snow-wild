// Silhouette de montagnes en SVG, en fond des bandeaux de l'accueil (purement décorative).
// La neige des sommets = une bande blanche ondulée, découpée par la forme de chaque chaîne.
const FAR = "M0 230 L140 120 L230 190 L360 70 L470 170 L560 110 L690 200 L820 90 L940 180 L1060 120 L1200 210 V320 H0 Z";
const NEAR = "M0 290 L110 210 L210 260 L330 160 L450 250 L560 190 L700 270 L830 180 L960 260 L1080 200 L1200 260 V320 H0 Z";

// Limite basse de la neige, légèrement irrégulière.
const snowLine = (y: number) =>
  `M0 0 H1200 V${y} ` +
  Array.from({ length: 24 }, (_, i) => `L${1200 - (i + 1) * 50} ${y + (i % 2 ? -6 : 8)}`).join(" ") +
  " Z";

export function Mountains({ className, id = "mtn" }: { className?: string; id?: string }) {
  return (
    <svg viewBox="0 0 1200 320" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <defs>
        <clipPath id={`${id}-far`}><path d={FAR} /></clipPath>
        <clipPath id={`${id}-near`}><path d={NEAR} /></clipPath>
      </defs>
      <path d={FAR} fill="#dbeafe" />
      <path d={snowLine(135)} fill="#ffffff" clipPath={`url(#${id}-far)`} />
      <path d={NEAR} fill="#bfdbfe" />
      <path d={snowLine(205)} fill="#ffffff" fillOpacity="0.9" clipPath={`url(#${id}-near)`} />
      <path d="M0 300 C200 270 400 310 600 290 C800 270 1000 305 1200 285 V320 H0 Z" fill="#ffffff" />
    </svg>
  );
}
