import path from "node:path";

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
  // Dossier des photos envoyées depuis le back-office (volume Docker en production).
  uploadDir: process.env.UPLOAD_DIR ?? path.resolve(process.cwd(), "uploads"),
  // Stripe est facultatif : sans clé, l'application utilise un paiement simulé.
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || null,
    // Clé publiable (pk_…), transmise au navigateur pour afficher le formulaire de carte.
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
  },
  // Émetteur des factures. Valeurs par défaut fictives : Snow Wild est un projet de démonstration.
  company: {
    name: process.env.COMPANY_NAME ?? "Snow Wild SAS",
    address: process.env.COMPANY_ADDRESS ?? "12 place des Glaciers",
    postalCode: process.env.COMPANY_POSTAL_CODE ?? "73320",
    city: process.env.COMPANY_CITY ?? "Tignes",
    email: process.env.COMPANY_EMAIL ?? "contact@snowwild.dev",
    siret: process.env.COMPANY_SIRET ?? "000 000 000 00000",
    vatNumber: process.env.COMPANY_VAT_NUMBER ?? "FR00000000000",
    legalForm: process.env.COMPANY_LEGAL_FORM ?? "SAS au capital de 10 000 €",
    rcs: process.env.COMPANY_RCS ?? "RCS Chambéry (fictif)",
    // Tant que ce n'est pas une vraie entreprise, chaque facture porte la mention « document fictif ».
    demo: process.env.COMPANY_DEMO !== "false",
  },
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
};
