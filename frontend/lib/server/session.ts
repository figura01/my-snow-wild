import "server-only";
import { serverGraphql } from "./graphql";

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "USER";
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
};

// Utilisateur connecté vu par l'API (qui vérifie la signature du JWT),
// ou null. Le front ne décide jamais à partir du cookie seul.
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const data = await serverGraphql<{ me: SessionUser | null }>(
      "{ me { id email firstName lastName role phone address postalCode city } }",
    );
    return data.me;
  } catch {
    return null;
  }
}
