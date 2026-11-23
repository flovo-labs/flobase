import { describe, it, expect, vi } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { runInit, runBuild } from "../src/cli.js";
import { loadSchemaFile } from "../src/utils.js";

describe("CLI commands and Utils", () => {
  it("loadSchemaFile reports non-existent file cleanly", async () => {
    const res = await loadSchemaFile("/non/existent/path/schema.yaml");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain("File not found");
    }
  });

  it("runInit scaffolds schema.yaml and .vscode/settings.json", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "flobase-test-init-"));
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await runInit(tempDir);

    const schemaPath = path.join(tempDir, "schema.yaml");
    const vscodePath = path.join(tempDir, ".vscode", "settings.json");

    const schemaContent = await fs.readFile(schemaPath, "utf-8");
    const vscodeContent = await fs.readFile(vscodePath, "utf-8");

    expect(schemaContent).toContain("TaskManagementApp");
    expect(schemaContent).toContain("User:");
    expect(schemaContent).toContain("Task:");
    expect(vscodeContent).toContain("flobase.schema.json");

    // Running init again should warn and not overwrite
    await runInit(tempDir);

    consoleSpy.mockRestore();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("runBuild generates all artifacts into output directory", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "flobase-test-build-"));
    const schemaFile = path.join(tempDir, "schema.yaml");
    const outDir = path.join(tempDir, "output");

    await fs.writeFile(
      schemaFile,
      `
version: "0.1.0"
models:
  Note:
    fields:
      id:
        type: uuid
        primary: true
      body:
        type: text
endpoints:
  - method: GET
    path: /api/notes
    model: Note
`,
      "utf-8"
    );

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    // Test Dry Run
    await runBuild({ schemaPath: schemaFile, outputDir: outDir, dryRun: true });

    // Test Actual Build
    await runBuild({ schemaPath: schemaFile, outputDir: outDir, dryRun: false });

    const erPath = path.join(outDir, "ER_DIAGRAM.md");
    const ddlPath = path.join(outDir, "schema.sql");
    const openapiPath = path.join(outDir, "openapi.yaml");

    expect(await fs.readFile(erPath, "utf-8")).toContain("erDiagram");
    expect(await fs.readFile(ddlPath, "utf-8")).toContain("CREATE TABLE IF NOT EXISTS note");
    expect(await fs.readFile(openapiPath, "utf-8")).toContain("openapi: 3.1.0");

    consoleSpy.mockRestore();
    await fs.rm(tempDir, { recursive: true, force: true });
  });
});
