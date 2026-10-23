import { getSessionUser } from "@/lib/server/session";

export default async function AdminDashboard() {
  const user = await getSessionUser();

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-bold">Tableau de bord</h1>
      <p className="text-muted">
        Connecté en tant que {user?.firstName} {user?.lastName}. Les écrans de gestion
        (matériels, catégories, réservations, utilisateurs) arrivent aux prochaines étapes.
      </p>
    </div>
  );
}
