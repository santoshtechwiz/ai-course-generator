import type { Config } from "jest"
import nextJest from "next/jest"

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
})

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jest-environment-jsdom",
  reporters: [
  "default",
  ["jest-html-reporter", {
    pageTitle: "Test Report",
    outputPath: "test-report.html",
    includeFailureMsg: true,
    includeSuiteFailure: true,
    theme: "defaultTheme", // other options: 'darkTheme', 'bootstrapTheme'
    sort: "status" // groups by pass/fail
  }]
],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    "^.+\\.(svg)$": "<rootDir>/__mocks__/svgMock.js",
    // Add canvas mock
    canvas: "<rootDir>/__mocks__/canvasMock.js",
    // Handle paths with parentheses
    "^@/app/dashboard/\\(quiz\\)/(.*)$": "<rootDir>/app/dashboard/(quiz)/$1",
  },
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.ts"
  ],
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
    "<rootDir>/coverage/",
    "<rootDir>/dist/"
  ],
  // Remove ts-jest transformer as next/jest handles this
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  verbose: false, // Reduce noise
  silent: false, // Allow console output for debugging
  noStackTrace: true, // Disable stack traces
  collectCoverage: false, // Disable coverage by default
  // Add reasonable timeout for tests
  testTimeout: 10000, // Reduce timeout to catch hanging tests faster
  transformIgnorePatterns: [
    // Transform ES modules in node_modules
    "node_modules/(?!(nanoid)/)",
  ],
  // Update testMatch to catch all test files in any directory
  testMatch: [
    "<rootDir>/**/*.test.[jt]s?(x)",
    "<rootDir>/**/*.spec.[jt]s?(x)"
  ],
  // Add roots to specify test locations - make sure all folders are included
  roots: [
    "<rootDir>"
  ],
  moduleDirectories: [
    "node_modules",
    "<rootDir>"
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)
