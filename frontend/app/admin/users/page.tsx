import { DeleteButton } from "@/components/admin/DeleteButton";
import { PageHeader } from "@/components/admin/PageHeader";
import { t } from "@/components/admin/table";
import { serverGraphql } from "@/lib/server/graphql";
import { getSessionUser } from "@/lib/server/session";
import { RoleSelect } from "./RoleSelect";

export const metadata = { title: "Comptes et rôles" };

type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  reservationCount: number;
};

const day = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

export default async function AdminUsersPage() {
  const [me, { adminUsers }] = await Promise.all([
    getSessionUser(),
    serverGraphql<{ adminUsers: AdminUser[] }>(
      "{ adminUsers { id email firstName lastName role createdAt reservationCount } }",
    ),
  ]);

  return (
    <>
      <PageHeader title="Comptes et rôles" />
      <div className={t.wrap}>
        <table className={`${t.table} lg:min-w-[760px]`}>
          <thead className={t.thead}>
            <tr>
              <th className={t.th}>Nom</th>
              <th className={t.th}>E-mail</th>
              <th className={t.th}>Inscrit le</th>
              <th className={t.th}>Réservations</th>
              <th className={t.th}>Rôle</th>
              <th className={`${t.th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className={t.tbody}>
            {adminUsers.map((user) => {
              const label = `${user.firstName} ${user.lastName}`;
              const isMe = user.id === me?.id;
              return (
                <tr key={user.id} className={t.tr}>
                  <td className={t.title}>
                    {label} {isMe && <span className="text-xs font-normal text-muted">(vous)</span>}
                  </td>
                  <td data-label="E-mail" className={`${t.td} break-all`}>{user.email}</td>
                  <td data-label="Inscrit le" className={t.td}>{day.format(new Date(user.createdAt))}</td>
                  <td data-label="Réservations" className={t.td}>{user.reservationCount}</td>
                  <td data-label="Rôle" className={`${t.td} items-center`}>
                    {isMe ? <span className="text-sm">Admin</span> : <RoleSelect id={user.id} role={user.role} label={label} />}
                  </td>
                  <td className={t.actions}>
                    {!isMe && <DeleteButton kind="user" id={user.id} label={label} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-muted">
        Supprimer un client conserve ses réservations (historique), avec ses informations de facturation.
      </p>
    </>
  );
}
