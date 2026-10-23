import "server-only";
import { cookies } from "next/headers";

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "USER";
};

const backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:4000";

// Récupère l'utilisateur connecté depuis un composant serveur, en transmettant
// le cookie du visiteur à l'API. C'est l'API qui vérifie la signature du JWT :
// le front ne prend jamais de décision de sécurité à partir du cookie seul.
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieHeader = (await cookies()).toString();
  if (!cookieHeader) return null;

  try {
    const res = await fetch(`${backendUrl}/graphql`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieHeader },
      body: JSON.stringify({ query: "{ me { id email firstName lastName role } }" }),
      cache: "no-store",
    });
    const json = (await res.json()) as { data?: { me: SessionUser | null } };
    return json.data?.me ?? null;
  } catch {
    return null;
  }
}
