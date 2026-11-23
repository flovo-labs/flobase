import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/ai-generator.ts",
        "src/bin.ts",
        "src/index.ts",
        "src/workspace.ts",
        "src/tools/**"
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80
      }
    }
  }
});
