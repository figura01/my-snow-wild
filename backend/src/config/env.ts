// Lecture centralisée de la configuration. Le serveur refuse de démarrer s'il
// manque une valeur indispensable, plutôt que de tourner avec un réglage faux.
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
}

const isProd = process.env.NODE_ENV === "production";

const jwtSecret = required("JWT_SECRET");
if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET doit contenir au moins 32 caractères.");
}

export const env = {
  isProd,
  port: Number(process.env.PORT ?? 4000),
  database: {
    host: required("DB_HOST"),
    port: Number(process.env.DB_PORT ?? 5432),
    user: required("POSTGRES_USER"),
    password: required("POSTGRES_PASSWORD"),
    name: required("POSTGRES_DB"),
  },
  jwtSecret,
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  // Stripe est facultatif : sans clé, l'application utilise un paiement simulé.
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || null,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
  },
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
};
