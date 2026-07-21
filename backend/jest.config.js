/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  testTimeout: 30000,
  transformIgnorePatterns: [
    "node_modules/(?!(uuid)/)",
  ],
  moduleNameMapper: {
    "^uuid$": "<rootDir>/node_modules/uuid/dist/cjs/index.js",
  },
};

