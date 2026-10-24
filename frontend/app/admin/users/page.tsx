import { DeleteButton } from "@/components/admin/DeleteButton";
import { PageHeader } from "@/components/admin/PageHeader";
import { serverGraphql } from "@/lib/server/graphql";
import { getSessionUser } from "@/lib/server/session";
import { RoleSelect } from "./RoleSelect";

export const metadata = { title: "Utilisateurs" };

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
      <PageHeader title="Utilisateurs" />
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line bg-snow text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Inscrit le</th>
              <th className="px-4 py-3">Réservations</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.map((user) => {
              const label = `${user.firstName} ${user.lastName}`;
              const isMe = user.id === me?.id;
              return (
                <tr key={user.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {label} {isMe && <span className="text-xs text-muted">(vous)</span>}
                  </td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{day.format(new Date(user.createdAt))}</td>
                  <td className="px-4 py-3">{user.reservationCount}</td>
                  <td className="px-4 py-3">
                    {isMe ? <span className="text-sm">Admin</span> : <RoleSelect id={user.id} role={user.role} label={label} />}
                  </td>
                  <td className="px-4 py-3 text-right">
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
