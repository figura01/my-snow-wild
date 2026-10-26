/** @type {import('jest').Config} */
module.exports = {
  transform: { "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.test.json" }] },
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  // Variables d'environnement de test (base dédiée), avant tout import de l'app.
  setupFiles: ["<rootDir>/test/setup-env.ts"],
  // Crée la base de test si elle n'existe pas encore.
  globalSetup: "<rootDir>/test/global-setup.ts",
  testTimeout: 30000,
};
