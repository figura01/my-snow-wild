// Les tests tournent sur une base séparée (« <POSTGRES_DB>_test ») pour ne jamais
// toucher aux données de développement.
process.env.NODE_ENV = "test";
process.env.DB_HOST ??= "localhost";
process.env.POSTGRES_USER ??= "snowwild";
process.env.POSTGRES_PASSWORD ??= "snowwild";
const base = process.env.POSTGRES_DB ?? "snowwild";
process.env.POSTGRES_DB = base.endsWith("_test") ? base : `${base}_test`;
process.env.JWT_SECRET ??= "secret-de-test-uniquement-pour-jest-0123456789";
delete process.env.STRIPE_SECRET_KEY; // paiement simulé pendant les tests
delete process.env.ADMIN_EMAIL;
