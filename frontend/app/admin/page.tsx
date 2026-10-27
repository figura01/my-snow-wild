import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { serverGraphql } from "@/lib/server/graphql";

export default async function AdminDashboard() {
  const { me, categories, adminMaterials, adminMaintenances, maintenanceConflicts } = await serverGraphql<{
    me: { firstName: string; lastName: string } | null;
    categories: { id: string }[];
    adminMaterials: { totalStock: number }[];
    adminMaintenances: { quantity: number }[];
    maintenanceConflicts: { size: string }[];
  }>(`{
    me { firstName lastName }
    categories { id }
    adminMaterials { totalStock }
    adminMaintenances(activeOnly: true) { quantity }
    maintenanceConflicts { size }
  }`);

  const stats = [
    { label: "Catégories", value: categories.length, href: "/admin/categories" },
    { label: "Références de matériel", value: adminMaterials.length, href: "/admin/materials" },
    {
      label: "Exemplaires en stock",
      value: adminMaterials.reduce((sum, m) => sum + m.totalStock, 0),
      href: "/admin/materials",
    },
    {
      label: "Exemplaires en maintenance",
      value: adminMaintenances.reduce((sum, m) => sum + m.quantity, 0),
      href: "/admin/maintenance",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold md:text-3xl">Tableau de bord</h1>
        <p className="text-muted">Bonjour {me?.firstName}.</p>
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="rounded-2xl border border-line bg-surface p-5 transition hover:border-glacier md:p-6">
            <span className="block text-3xl font-extrabold">{stat.value}</span>
            <span className="text-sm text-muted">{stat.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
