import { AlertTriangle, Info } from "lucide-react";
import Link from "next/link";
import { OutcomeBar } from "@/components/admin/dashboard/OutcomeBar";
import { RankedBars } from "@/components/admin/dashboard/RankedBars";
import { SeasonChart, type WeekPoint } from "@/components/admin/dashboard/SeasonChart";
import { StatTile } from "@/components/admin/dashboard/StatTile";
import { euros, fullDateLabel, percent, pointsDelta, relativeDelta } from "@/components/admin/dashboard/format";
import { serverGraphql } from "@/lib/server/graphql";

export const dynamic = "force-dynamic";

type Season = { startYear: number; label: string; start: string; end: string };
type Kpis = { revenueCents: number; paidCount: number; averageBasketCents: number; fillRate: number };
type Dashboard = {
  season: Season;
  previousSeason: Season;
  asOf: string;
  previousAsOf: string;
  isCurrent: boolean;
  seasons: Season[];
  current: Kpis;
  previous: Kpis;
  weeks: WeekPoint[];
  materials: { id: string; name: string; category: string; rentalDays: number; revenueCents: number }[];
  categories: { name: string; rentalDays: number; revenueCents: number }[];
  outcomes: { paid: number; pending: number; expired: number; cancelled: number };
  demoReservations: number;
};

const KPIS = "revenueCents paidCount averageBasketCents fillRate";
const SEASON = "startYear label start end";

const Card = ({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) => (
  <section className={`flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 md:p-6 ${className}`}>
    <div className="flex flex-col gap-0.5">
      <h2 className="text-lg font-bold">{title}</h2>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
    </div>
    {children}
  </section>
);

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ saison?: string }> }) {
  const { saison } = await searchParams;
  const requested = saison && /^\d{4}$/.test(saison) ? Number(saison) : null;

  const { me, dashboard: d, adminMaterials, adminMaintenances, maintenanceConflicts } = await serverGraphql<{
    me: { firstName: string } | null;
    dashboard: Dashboard;
    adminMaterials: { totalStock: number }[];
    adminMaintenances: { quantity: number }[];
    maintenanceConflicts: { size: string }[];
  }>(
    `query($season: Int) {
      me { firstName }
      dashboard: adminDashboard(season: $season) {
        season { ${SEASON} } previousSeason { ${SEASON} } asOf previousAsOf isCurrent seasons { ${SEASON} }
        current { ${KPIS} } previous { ${KPIS} }
        weeks { week weekStart current previous }
        materials { id name category rentalDays revenueCents }
        categories { name rentalDays revenueCents }
        outcomes { paid pending expired cancelled }
        demoReservations
      }
      adminMaterials { totalStock }
      adminMaintenances(activeOnly: true) { quantity }
      maintenanceConflicts { size }
    }`,
    { season: requested },
  );

  const comparedTo = d.isCurrent ? `vs ${fullDateLabel(d.previousAsOf)}` : `vs saison ${d.previousSeason.label}`;
  const period = d.isCurrent
    ? `Saison ${d.season.label}, du 1er octobre au ${fullDateLabel(d.asOf)}`
    : `Saison ${d.season.label} complète`;
  const stock = adminMaterials.reduce((sum, m) => sum + m.totalStock, 0);
  const inMaintenance = adminMaintenances.reduce((sum, m) => sum + m.quantity, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold md:text-3xl">Tableau de bord</h1>
        <p className="text-muted">Bonjour {me?.firstName}. {period}.</p>
      </div>

      {maintenanceConflicts.length > 0 && (
        <Link
          href="/admin/maintenance"
          className="flex items-center gap-3 rounded-2xl border border-amber-300 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-400/10 px-5 py-4 text-sm font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-400/20"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
          {maintenanceConflicts.length} réservation{maintenanceConflicts.length > 1 ? "s" : ""} à venir touchée
          {maintenanceConflicts.length > 1 ? "s" : ""} par une maintenance : voir le détail
        </Link>
      )}

      {/* Filtre unique : la saison, qui s'applique à tout ce qui suit. */}
      <nav aria-label="Saison" className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {d.seasons.map((s) => {
          const current = s.startYear === d.season.startYear;
          return (
            <Link
              key={s.startYear}
              href={s.startYear === d.seasons[0].startYear ? "/admin" : `/admin?saison=${s.startYear}`}
              aria-current={current ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
                current ? "border-glacier bg-sky-50 dark:bg-glacier/15 font-semibold text-glacier" : "border-line bg-surface hover:border-glacier"
              }`}
            >
              Saison {s.label}
              {s.startYear === d.seasons[0].startYear && " (en cours)"}
            </Link>
          );
        })}
      </nav>

      {d.demoReservations > 0 && (
        <p className="flex items-start gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-glacier" aria-hidden="true" />
          <span>
            Données de démonstration : ces chiffres incluent {d.demoReservations} réservations fictives générées par{" "}
            <code className="font-mono text-xs">npm run seed:history</code>. Elles ne bloquent aucun matériel et n&apos;apparaissent pas dans
            les listes.
          </span>
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Chiffre d'affaires TTC"
          value={euros(d.current.revenueCents)}
          delta={relativeDelta(d.current.revenueCents, d.previous.revenueCents)}
          comparedTo={comparedTo}
        />
        <StatTile
          label="Réservations payées"
          value={String(d.current.paidCount)}
          delta={relativeDelta(d.current.paidCount, d.previous.paidCount)}
          comparedTo={comparedTo}
        />
        <StatTile
          label="Panier moyen"
          value={euros(d.current.averageBasketCents)}
          delta={relativeDelta(d.current.averageBasketCents, d.previous.averageBasketCents)}
          comparedTo={comparedTo}
        />
        <StatTile
          label="Remplissage de la saison"
          value={percent(d.current.fillRate)}
          delta={pointsDelta(d.current.fillRate, d.previous.fillRate)}
          comparedTo={comparedTo}
          hint="Part des jours × exemplaires de la saison déjà réservée."
        />
      </div>

      <Card
        title="Progression de la saison"
        subtitle={`Chiffre d'affaires cumulé, semaine par semaine, comparé à la saison ${d.previousSeason.label}.`}
      >
        <SeasonChart weeks={d.weeks} currentLabel={d.season.label} previousLabel={d.previousSeason.label} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Matériels les plus loués" subtitle="Top 5 de la période, réservations payées.">
          <RankedBars
            label="Matériels les plus loués"
            items={d.materials.map((m) => ({ ...m, detail: m.category }))}
            limit={5}
            emptyText="Aucune location payée sur cette période."
          />
        </Card>
        <Card title="Par catégorie" subtitle="Répartition des locations payées.">
          <RankedBars
            label="Locations par catégorie"
            items={d.categories.map((c) => ({ ...c, id: c.name }))}
            emptyText="Aucune location payée sur cette période."
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card title="Devenir des commandes" subtitle="Commandes passées sur la période, selon leur statut aujourd'hui.">
          <OutcomeBar outcomes={d.outcomes} />
        </Card>
        <Card title="Parc de matériel" subtitle="Aujourd'hui.">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Références", value: adminMaterials.length, href: "/admin/materials" },
              { label: "Exemplaires", value: stock, href: "/admin/materials" },
              { label: "En maintenance", value: inMaintenance, href: "/admin/maintenance" },
              { label: "Disponibles", value: stock - inMaintenance, href: "/admin/materials" },
            ].map((s) => (
              <Link key={s.label} href={s.href} className="flex flex-col rounded-xl border border-line p-3 hover:border-glacier">
                <span className="text-xs text-muted">{s.label}</span>
                <span className="text-2xl font-bold">{s.value}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
