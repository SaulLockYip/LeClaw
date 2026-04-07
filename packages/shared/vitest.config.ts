import { defineConfig } from "vitest/config";
import { sharedVitestConfig } from "../../vitest.shared.config.ts";

export default defineConfig({
  ...sharedVitestConfig,
  test: {
    ...sharedVitestConfig.test,
    include: ["src/**/*.test.ts"],
    exclude: [...sharedVitestConfig.test.exclude],
  },
});
