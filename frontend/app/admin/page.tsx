import Link from "next/link";
import { serverGraphql } from "@/lib/server/graphql";

export default async function AdminDashboard() {
  const { me, categories, adminMaterials } = await serverGraphql<{
    me: { firstName: string; lastName: string } | null;
    categories: { id: string }[];
    adminMaterials: { totalStock: number }[];
  }>("{ me { firstName lastName } categories { id } adminMaterials { totalStock } }");

  const stats = [
    { label: "Catégories", value: categories.length, href: "/admin/categories" },
    { label: "Références de matériel", value: adminMaterials.length, href: "/admin/materials" },
    {
      label: "Exemplaires en stock",
      value: adminMaterials.reduce((sum, m) => sum + m.totalStock, 0),
      href: "/admin/materials",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted">Bonjour {me?.firstName}.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="rounded-2xl border border-line bg-white p-6 transition hover:border-glacier">
            <span className="block text-3xl font-extrabold">{stat.value}</span>
            <span className="text-sm text-muted">{stat.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
