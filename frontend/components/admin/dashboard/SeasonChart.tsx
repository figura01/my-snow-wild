"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { compactEuros, dayMonthLabel, euros, monthLabel } from "./format";

export type WeekPoint = { week: number; weekStart: string; current: number | null; previous: number | null };

type Props = { weeks: WeekPoint[]; currentLabel: string; previousLabel: string };

const HEIGHT = 260;
const M = { top: 16, right: 84, bottom: 30, left: 56 };

/** Maximum « rond » de l'axe et pas des graduations (4 intervalles). */
function niceScale(max: number) {
  const rough = Math.max(max, 1) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * magnitude).find((s) => s >= rough)!;
  return { max: step * 4, ticks: [0, 1, 2, 3, 4].map((i) => i * step) };
}

// Chiffre d'affaires cumulé semaine par semaine : saison affichée (trait plein, couleur
// principale) et saison précédente (gris, en retrait). Survol ou flèches du clavier :
// réticule et valeurs des deux saisons. Un tableau donne les mêmes chiffres sans survol.
export function SeasonChart({ weeks, currentLabel, previousLabel }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(300, Math.round(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={box} className="min-h-[260px]">
      {width !== null && <Chart weeks={weeks} currentLabel={currentLabel} previousLabel={previousLabel} width={width} />}
    </div>
  );
}

function Chart({ weeks, currentLabel, previousLabel, width }: Props & { width: number }) {
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();
  const narrow = width < 520;
  const margin = { ...M, right: narrow ? 16 : M.right };
  const plotW = width - margin.left - margin.right;
  const plotH = HEIGHT - margin.top - margin.bottom;
  const { max, ticks } = niceScale(Math.max(...weeks.flatMap((w) => [w.current ?? 0, w.previous ?? 0])));
  const x = (i: number) => margin.left + (i * plotW) / Math.max(1, weeks.length - 1);
  const y = (v: number) => margin.top + plotH - (v / max) * plotH;

  const points = (key: "current" | "previous") =>
    weeks.flatMap((w, i) => (w[key] === null ? [] : [[x(i), y(w[key]!)] as const]));
  const line = (pts: readonly (readonly [number, number])[]) => pts.map(([px, py], i) => `${i ? "L" : "M"}${px},${py}`).join(" ");
  const currentPts = points("current");
  const previousPts = points("previous");
  const area = currentPts.length > 1
    ? `${line(currentPts)} L${currentPts[currentPts.length - 1][0]},${y(0)} L${currentPts[0][0]},${y(0)} Z`
    : "";

  // Un repère par mois : la première semaine qui commence dans ce mois.
  const monthTicks = weeks.filter((w, i) => i === 0 || w.weekStart.slice(5, 7) !== weeks[i - 1].weekStart.slice(5, 7));

  const lastCurrent = [...weeks].reverse().find((w) => w.current !== null);
  const lastPrevious = weeks[weeks.length - 1];
  const endLabels = !narrow && lastCurrent && lastPrevious.previous !== null
    ? [
        { key: "current", value: lastCurrent.current!, yPos: y(lastCurrent.current!), xPos: x(lastCurrent.week) },
        { key: "previous", value: lastPrevious.previous!, yPos: y(lastPrevious.previous!), xPos: x(lastPrevious.week) },
      ]
    : [];
  // Étiquettes de fin : seulement si elles ne se chevauchent pas (sinon légende + survol).
  const showEndLabels = endLabels.length === 2 && (Math.abs(endLabels[0].yPos - endLabels[1].yPos) >= 16 || Math.abs(endLabels[0].xPos - endLabels[1].xPos) > 80);

  function onPointer(e: PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setActive(Math.min(weeks.length - 1, Math.max(0, Math.round(ratio * (weeks.length - 1)))));
  }

  function onKey(e: KeyboardEvent<SVGSVGElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const start = active ?? (lastCurrent?.week ?? 0);
    const next = e.key === "Home" ? 0 : e.key === "End" ? weeks.length - 1 : start + (e.key === "ArrowRight" ? 1 : -1);
    setActive(Math.min(weeks.length - 1, Math.max(0, next)));
  }

  const hovered = active === null ? null : weeks[active];
  const tooltipLeft = active === null ? 0 : Math.min(Math.max(x(active) - 90, 0), width - 180);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-4 text-sm text-muted" aria-label="Légende">
          <li className="flex items-center gap-2">
            <span className="h-0.5 w-5 rounded-full bg-[var(--viz-current)]" aria-hidden="true" />
            Saison {currentLabel}
          </li>
          <li className="flex items-center gap-2">
            <span className="h-0.5 w-5 rounded-full bg-[var(--viz-previous)]" aria-hidden="true" />
            Saison {previousLabel}
          </li>
        </ul>
        <button
          type="button"
          className="text-sm font-semibold text-glacier hover:underline"
          aria-expanded={showTable}
          aria-controls={tableId}
          onClick={() => setShowTable((v) => !v)}
        >
          {showTable ? "Masquer le tableau" : "Voir le tableau"}
        </button>
      </div>

      <div className="relative">
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Chiffre d'affaires cumulé par semaine, saison ${currentLabel} comparée à ${previousLabel}. Flèches gauche et droite pour parcourir les semaines.`}
          tabIndex={0}
          onKeyDown={onKey}
          onBlur={() => setActive(null)}
          className="block overflow-visible rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-glacier"
        >
          {/* Grille horizontale et graduations */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={margin.left} x2={width - margin.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--viz-axis)" : "var(--viz-grid)"} strokeWidth={1} />
              <text x={margin.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
                {compactEuros(t)}
              </text>
            </g>
          ))}
          {monthTicks.map((w) => (
            <text key={w.week} x={x(w.week)} y={HEIGHT - 8} textAnchor="middle" className="fill-muted text-[11px]">
              {monthLabel(w.weekStart)}
            </text>
          ))}

          {/* Saison précédente, puis saison affichée par-dessus */}
          <path d={line(previousPts)} fill="none" stroke="var(--viz-previous)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {area && <path d={area} fill="var(--viz-current)" opacity={0.1} />}
          <path d={line(currentPts)} fill="none" stroke="var(--viz-current)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {/* Point de fin de la saison affichée (aujourd'hui) */}
          {lastCurrent && (
            <circle cx={x(lastCurrent.week)} cy={y(lastCurrent.current!)} r={4.5} fill="var(--viz-current)" stroke="var(--color-surface)" strokeWidth={2} />
          )}

          {showEndLabels &&
            endLabels.map((l) => (
              <text key={l.key} x={l.xPos + 10} y={l.yPos} dy="0.32em" className={`text-[12px] ${l.key === "current" ? "fill-ink font-semibold" : "fill-muted"}`}>
                {compactEuros(l.value)}
              </text>
            ))}

          {/* Réticule */}
          {hovered && (
            <g aria-hidden="true">
              <line x1={x(hovered.week)} x2={x(hovered.week)} y1={margin.top} y2={y(0)} stroke="var(--viz-axis)" strokeWidth={1} />
              {hovered.previous !== null && (
                <circle cx={x(hovered.week)} cy={y(hovered.previous)} r={4} fill="var(--viz-previous)" stroke="var(--color-surface)" strokeWidth={2} />
              )}
              {hovered.current !== null && (
                <circle cx={x(hovered.week)} cy={y(hovered.current)} r={4} fill="var(--viz-current)" stroke="var(--color-surface)" strokeWidth={2} />
              )}
            </g>
          )}

          <rect
            x={margin.left}
            y={margin.top}
            width={plotW}
            height={plotH}
            fill="transparent"
            onPointerMove={onPointer}
            onPointerLeave={() => setActive(null)}
          />
        </svg>

        {hovered && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 w-[180px] rounded-xl border border-line bg-surface p-3 text-sm shadow-lg"
            style={{ left: tooltipLeft }}
          >
            <p className="mb-1.5 text-xs text-muted">Semaine du {dayMonthLabel(hovered.weekStart)}</p>
            <p className="flex items-center gap-2">
              <span className="h-0.5 w-3 rounded-full bg-[var(--viz-current)]" aria-hidden="true" />
              <strong className="tabular-nums">{hovered.current === null ? "—" : euros(hovered.current)}</strong>
              <span className="text-xs text-muted">{currentLabel}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="h-0.5 w-3 rounded-full bg-[var(--viz-previous)]" aria-hidden="true" />
              <strong className="tabular-nums">{hovered.previous === null ? "—" : euros(hovered.previous)}</strong>
              <span className="text-xs text-muted">{previousLabel}</span>
            </p>
          </div>
        )}
      </div>

      {showTable && (
        <div id={tableId} className="max-h-72 overflow-y-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <caption className="sr-only">Chiffre d&apos;affaires cumulé par semaine</caption>
            <thead className="sticky top-0 bg-snow text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Semaine du</th>
                <th className="px-3 py-2 text-right font-semibold">{currentLabel}</th>
                <th className="px-3 py-2 text-right font-semibold">{previousLabel}</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.week} className="border-t border-line">
                  <td className="px-3 py-1.5">{dayMonthLabel(w.weekStart)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{w.current === null ? "—" : euros(w.current)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-muted">{w.previous === null ? "—" : euros(w.previous)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
