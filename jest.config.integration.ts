import type { Config } from "jest";

const config: Config = {
  displayName: "Integration Tests",
  testEnvironment: "node",
  testMatch: ["**/__tests__/integration/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.node.ts"],
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testTimeout: 30000, // 30 seconds for integration tests
};

export default config;
