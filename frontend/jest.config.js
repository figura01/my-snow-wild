// next/jest reprend la configuration de Next (SWC, alias « @/ », CSS…).
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  testMatch: ["<rootDir>/__tests__/**/*.test.{ts,tsx}"],
};

module.exports = createJestConfig(config);
