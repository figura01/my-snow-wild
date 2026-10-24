// N'accepte qu'un chemin interne (« /commande ») comme destination après connexion,
// pour éviter les redirections vers un site externe (« //evil.com », « https://… »).
export function safeNext(value: unknown, fallback = "/"): string {
  return typeof value === "string" && /^\/(?!\/)/.test(value) ? value : fallback;
}
