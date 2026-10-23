import "server-only";
import { cookies } from "next/headers";

const backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:4000";

export class GraphQLRequestError extends Error {}

// Appel GraphQL depuis un composant serveur, en transmettant le cookie du
// visiteur : l'API applique ses propres règles d'autorisation.
export async function serverGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${backendUrl}/graphql`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new GraphQLRequestError(json.errors[0].message);
  if (!json.data) throw new GraphQLRequestError("Réponse vide de l'API.");
  return json.data;
}
