import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

// Client Apollo utilisé dans les composants client. L'URL est relative :
// Next.js relaie /graphql vers l'API (voir next.config.ts).
export function makeApolloClient() {
  return new ApolloClient({
    link: new HttpLink({ uri: "/graphql", credentials: "same-origin" }),
    cache: new InMemoryCache(),
  });
}
