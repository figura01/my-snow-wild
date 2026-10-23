import "server-only";
import { serverGraphql } from "./graphql";

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "USER";
};

// Utilisateur connecté vu par l'API (qui vérifie la signature du JWT),
// ou null. Le front ne décide jamais à partir du cookie seul.
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const data = await serverGraphql<{ me: SessionUser | null }>(
      "{ me { id email firstName lastName role } }",
    );
    return data.me;
  } catch {
    return null;
  }
}
