import { CustomerImportPanel } from "@/components/admin/CustomerImportPanel";
import { PageHeader } from "@/components/admin/PageHeader";
import { t } from "@/components/admin/table";
import { formatPrice } from "@/lib/format";
import { serverGraphql } from "@/lib/server/graphql";

export const metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

type AdminCustomer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  postalCode: string | null;
  city: string | null;
  source: "SIGNUP" | "IMPORT";
  createdAt: string;
  hasAccount: boolean;
  reservationCount: number;
  paidCents: number;
};

const day = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

// Fiches clients : inscrits (avec compte) et fiches importées (sans compte).
// Les comptes eux-mêmes (rôles, suppression) se gèrent dans « Comptes et rôles ».
export default async function AdminCustomersPage() {
  const { adminCustomers: customers } = await serverGraphql<{ adminCustomers: AdminCustomer[] }>(
    "{ adminCustomers { id email firstName lastName phone postalCode city source createdAt hasAccount reservationCount paidCents } }",
  );
  const withAccount = customers.filter((c) => c.hasAccount).length;

  return (
    <>
      <PageHeader title="Clients" />
      <p className="-mt-3 mb-6 text-sm text-muted">
        {customers.length} fiche{customers.length > 1 ? "s" : ""} · {withAccount} avec compte · {customers.length - withAccount} sans compte
      </p>

      <div className="mb-8">
        <CustomerImportPanel />
      </div>

      <div className={t.wrap}>
        <table className={`${t.table} lg:min-w-[860px]`}>
          <thead className={t.thead}>
            <tr>
              <th className={t.th}>Client</th>
              <th className={t.th}>Téléphone</th>
              <th className={t.th}>Ville</th>
              <th className={t.th}>Compte</th>
              <th className={t.th}>Réservations</th>
              <th className={t.th}>Payé</th>
              <th className={t.th}>Créée le</th>
            </tr>
          </thead>
          <tbody className={t.tbody}>
            {customers.length === 0 && (
              <tr className={t.tr}>
                <td colSpan={7} className={t.empty}>Aucun client pour le moment.</td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className={t.tr}>
                <td className={t.title}>
                  {c.firstName} {c.lastName}
                  <span className="block break-all text-xs font-normal text-muted">{c.email}</span>
                </td>
                <td data-label="Téléphone" className={t.td}>{c.phone ?? "—"}</td>
                <td data-label="Ville" className={t.td}>
                  {c.city ? `${c.postalCode ? `${c.postalCode} ` : ""}${c.city}` : "—"}
                </td>
                <td data-label="Compte" className={t.td}>
                  {c.hasAccount ? (
                    <span className="rounded-full bg-green-100 dark:bg-green-400/15 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
                      Inscrit
                    </span>
                  ) : (
                    <span className="rounded-full bg-line px-2.5 py-0.5 text-xs font-medium text-muted">
                      {c.source === "IMPORT" ? "Importé, sans compte" : "Sans compte"}
                    </span>
                  )}
                </td>
                <td data-label="Réservations" className={t.td}>{c.reservationCount}</td>
                <td data-label="Payé" className={`${t.td} font-semibold`}>{c.paidCents ? formatPrice(c.paidCents) : "—"}</td>
                <td data-label="Créée le" className={`${t.td} lg:whitespace-nowrap`}>{day.format(new Date(c.createdAt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
