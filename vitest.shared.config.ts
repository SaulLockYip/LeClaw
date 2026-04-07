export const sharedVitestConfig = {
  resolve: {
    alias: {
      "@leclaw/shared": "./packages/shared/src",
      "@leclaw/db": "./packages/db/src",
    },
  },
  test: {
    testTimeout: 120_000,
    hookTimeout: 120_000,
    pool: "threads",
    include: ["packages/**/*.test.ts"],
    exclude: ["dist/**", "**/node_modules/**", "**/*.e2e.test.ts"],
    coverage: {
      provider: "v8" as const,
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 55,
        statements: 70,
      },
    },
  },
};
