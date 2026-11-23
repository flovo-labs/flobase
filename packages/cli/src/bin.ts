#!/usr/bin/env node

import { createServer } from "./index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { runInit, runBuild } from "./cli.js";
import pc from "picocolors";
import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const args = process.argv.slice(2);
const command = args[0];

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  if (command === "init") {
    await runInit();
    return;
  }

  if (command === "build") {
    const flags = {
      dryRun: args.includes("--dry-run"),
      ai: args.includes("--ai"),
      schemaPath: args.find((a) => !a.startsWith("-") && a !== "build") || "schema.yaml"
    };
    await runBuild(flags);
    return;
  }

  if (command === "editor") {
    const targetSchemaPath = path.resolve(
      process.cwd(),
      args.find((a) => !a.startsWith("-") && a !== "editor") || "schema.yaml"
    );

    // Locate editor package directory
    let editorPkgDir = path.resolve(__dirname, "../../packages/editor");
    if (!fs.existsSync(editorPkgDir)) {
      editorPkgDir = path.resolve(__dirname, "../packages/editor");
    }
    if (!fs.existsSync(editorPkgDir)) {
      editorPkgDir = path.resolve(__dirname, "editor");
    }

    console.log(pc.green(`Launching Flobase Visual Editor...`));
    console.log(pc.gray(`Target schema: ${targetSchemaPath}`));

    // Spawn backend express server
    const serverProcess = spawn(
      "node",
      ["--loader", "ts-node/esm", "server.ts"],
      {
        cwd: editorPkgDir,
        env: {
          ...process.env,
          FLOBASE_SCHEMA_PATH: targetSchemaPath,
          PORT: "3001"
        },
        stdio: "inherit"
      }
    );

    // Spawn Vite dev server on strict port 5173
    const viteProcess = spawn(
      "npx",
      ["vite", "--port", "5173", "--strictPort"],
      {
        cwd: editorPkgDir,
        env: process.env,
        stdio: "inherit"
      }
    );

    // Give Vite a second to bind then attempt to open browser
    setTimeout(() => {
      const openCmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
      spawn(openCmd, ["http://localhost:5173"], { stdio: "ignore" }).on("error", () => {});
      console.log(pc.green(`Visual editor live at http://localhost:5173`));
    }, 1500);

    const cleanup = () => {
      serverProcess.kill();
      viteProcess.kill();
      process.exit(0);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    return;
  }

  if (command === "--help" || command === "-h") {
    console.log(`
${pc.bold(pc.green("flobase"))} ${pc.gray("-")} Deterministic Postgres DDL, OpenAPI 3.1 & Mermaid ER diagrams from one YAML

${pc.bold("USAGE")}
  $ flobase [command] [options]

${pc.bold("COMMANDS")}
  init                  Scaffold a starter schema.yaml and VSCode schema autocomplete
  build <schema.yaml>   Generate Postgres DDL, OpenAPI 3.1 spec, and Mermaid ER diagram
  editor [schema.yaml]  Launch local visual canvas editor in browser (React Flow)
  (no command)          Start MCP server (STDIO mode) for Cursor/Claude/Windsurf

${pc.bold("OPTIONS")}
  --dry-run             Print outputs to stdout without writing files
  --ai                  Generate optional API_DOCS.md using GEMINI_API_KEY
  -h, --help            Show CLI help
  -v, --version         Show version
`);
    return;
  }

  if (command === "--version" || command === "-v") {
    console.log("0.1.0");
    return;
  }

  // Default: Start MCP Server over StdioServerTransport
  const server = createServer();
  const transport = new StdioServerTransport();

  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await server.close();
    process.exit(0);
  });

  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err?.message || String(err)}\n`);
  process.exit(1);
});
