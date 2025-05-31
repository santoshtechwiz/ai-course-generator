import nextJest from "next/jest";
import type { Config } from "jest";

// Configure Next.js app directory
const createJestConfig = nextJest({
  dir: "./",
});

// Jest config overrides
const customJestConfig: Config = {
  testEnvironment: "jest-environment-jsdom",
  coverageProvider: "v8",
  verbose: true,
  reporters: ["default", "jest-summary-reporter"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@/app/dashboard/(quiz)/components/(.*)$": "<rootDir>/app/dashboard/(quiz)/components/$1",
    "^.+\\.svg$": "<rootDir>/__mocks__/svgMock.js",
    "^canvas$": "<rootDir>/__mocks__/canvasMock.js",
  },

  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/dist/"],
  collectCoverageFrom: [
    "**/*.{ts,tsx,js,jsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
    "!**/dist/**",
  ],

  transformIgnorePatterns: [
    "node_modules/(?!(nanoid)/)", // allow ESM transform for nanoid
  ],

  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testTimeout: 15000, // Increase timeout for complex tests
};

export default createJestConfig(customJestConfig);
