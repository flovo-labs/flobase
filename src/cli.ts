import * as fs from "fs/promises";
import * as path from "path";
import pc from "picocolors";
import { loadSchemaFile } from "./utils.js";
import { generateMermaidEr } from "./er-generator.js";
import { generatePostgresDDL } from "./pg-generator.js";
import { generateOpenApiYaml } from "./openapi-generator.js";
import { generateApiDocsWithAi } from "./ai-generator.js";
import { formatError, logSuccess, logWarning, logError } from "./errors.js";

const DEFAULT_SAMPLE_SCHEMA = `# Flobase v0.1.0 Specification
# One YAML for Postgres DDL, OpenAPI 3.1, and Mermaid ER Diagrams
version: "0.1.0"
name: "TaskManagementApp"
description: "Core schema for team users and task assignments"

models:
  # User Model representing system users
  User:
    tableName: "users"
    description: "Registered team members and account owners"
    fields:
      id:
        type: uuid
        primary: true
        description: "Unique identifier for user"
      email:
        type: string
        unique: true
        required: true
        description: "Primary login email"
      name:
        type: string
        required: true
        description: "Full name"
      createdAt:
        type: timestamp
        required: true
        description: "Creation timestamp"
    relationships:
      tasks:
        type: one-to-many
        model: Task
        foreignKey: userId

  # Task Model representing work items assigned to users
  Task:
    tableName: "tasks"
    description: "Actionable tasks assigned to users"
    fields:
      id:
        type: uuid
        primary: true
        description: "Task unique identifier"
      userId:
        type: uuid
        required: true
        references: "User.id"
        description: "User assigned to this task"
      title:
        type: string
        required: true
        description: "Task title"
      completed:
        type: bool
        default: false
        description: "Whether task is marked complete"
      createdAt:
        type: timestamp
        required: true
        description: "Creation timestamp"
    relationships:
      user:
        type: many-to-one
        model: User
        foreignKey: userId

endpoints:
  - method: GET
    path: /api/tasks
    summary: "List all tasks"
    model: Task

  - method: POST
    path: /api/tasks
    summary: "Create a new task"
    model: Task
`;

export interface BuildOptions {
  schemaPath: string;
  outputDir?: string;
  dryRun?: boolean;
  ai?: boolean;
}

export async function runInit(targetDir: string = process.cwd()): Promise<void> {
  const schemaFile = path.join(targetDir, "schema.yaml");
  const vscodeDir = path.join(targetDir, ".vscode");
  const vscodeSettings = path.join(vscodeDir, "settings.json");

  try {
    // 1. Write schema.yaml if not present
    let schemaExisted = false;
    try {
      await fs.access(schemaFile);
      schemaExisted = true;
      logWarning(`File 'schema.yaml' already exists. Skipping overwrite.`);
    } catch {
      await fs.writeFile(schemaFile, DEFAULT_SAMPLE_SCHEMA, "utf-8");
      logSuccess(`Created 'schema.yaml' with example User and Task models.`);
    }

    // 2. Setup .vscode/settings.json
    await fs.mkdir(vscodeDir, { recursive: true });
    let settingsObj: Record<string, any> = {};
    try {
      const existingSettings = await fs.readFile(vscodeSettings, "utf-8");
      settingsObj = JSON.parse(existingSettings);
    } catch {
      settingsObj = {};
    }

    settingsObj["yaml.schemas"] = settingsObj["yaml.schemas"] || {};
    settingsObj["yaml.schemas"]["./node_modules/flobase-mcp/flobase.schema.json"] = [
      "schema.yaml",
      "*.schema.yaml"
    ];

    await fs.writeFile(vscodeSettings, JSON.stringify(settingsObj, null, 2) + "\n", "utf-8");
    logSuccess(`Configured VSCode YAML schema autocomplete in '.vscode/settings.json'.`);

    // 3. Next steps banner
    console.log(`\n${pc.bold(pc.cyan("Next steps:"))}`);
    console.log(`  1. Inspect and customize ${pc.green("schema.yaml")}`);
    console.log(`  2. Generate artifacts: ${pc.bold(pc.yellow("npx flobase build schema.yaml"))}\n`);
  } catch (err) {
    logError(formatError(err, targetDir));
    process.exit(1);
  }
}

export async function runBuild(options: BuildOptions): Promise<void> {
  const schemaPath = options.schemaPath || "schema.yaml";
  const outputDir = path.resolve(process.cwd(), options.outputDir || "output");

  const loaded = await loadSchemaFile(schemaPath);
  if (!loaded.success) {
    logError(formatError(loaded.error, loaded.filePath));
    process.exit(1);
  }

  const { parsedResult, filePath } = loaded.data;
  if (!parsedResult.success || !parsedResult.data) {
    for (const err of parsedResult.errors) {
      logError(formatError(err, filePath));
    }
    process.exit(1);
  }

  const schema = parsedResult.data;

  // 1. Generate ER Diagram
  const erMermaid = generateMermaidEr(schema);
  const erMarkdown = `# Entity-Relationship Diagram\n\n\`\`\`mermaid\n${erMermaid}\`\`\`\n`;

  // 2. Generate Postgres DDL
  const postgresDdl = generatePostgresDDL(schema);

  // 3. Generate OpenAPI 3.1
  const openApiYaml = generateOpenApiYaml(schema);

  // 4. Optional AI Layer
  let aiDocs: string | null = null;
  if (options.ai) {
    try {
      console.log(pc.cyan("Generating API documentation via Gemini API..."));
      aiDocs = await generateApiDocsWithAi(schema);
      logSuccess("AI API documentation generated.");
    } catch (err) {
      logWarning(`AI generation skipped: ${(err as any)?.message || String(err)}`);
    }
  }

  // Handle dry-run mode
  if (options.dryRun) {
    console.log(`\n${pc.bold(pc.green("=== DRY RUN (No files modified) ==="))}\n`);
    console.log(pc.bold(pc.green(`[1] ${path.join(outputDir, "ER_DIAGRAM.md")}:`)));
    console.log(erMarkdown);
    console.log(pc.bold(pc.green(`[2] ${path.join(outputDir, "schema.sql")}:`)));
    console.log(postgresDdl);
    console.log(pc.bold(pc.green(`[3] ${path.join(outputDir, "openapi.yaml")}:`)));
    console.log(openApiYaml);
    if (aiDocs) {
      console.log(pc.bold(pc.green(`[4] ${path.join(outputDir, "API_DOCS.md")}:`)));
      console.log(aiDocs);
    }
    logSuccess("Dry run completed successfully.");
    return;
  }

  // Write artifacts to output directory
  try {
    await fs.mkdir(outputDir, { recursive: true });

    await fs.writeFile(path.join(outputDir, "ER_DIAGRAM.md"), erMarkdown, "utf-8");
    logSuccess(`Generated ER diagram -> ${path.join("output", "ER_DIAGRAM.md")}`);

    await fs.writeFile(path.join(outputDir, "schema.sql"), postgresDdl, "utf-8");
    logSuccess(`Generated PostgreSQL DDL -> ${path.join("output", "schema.sql")}`);

    await fs.writeFile(path.join(outputDir, "openapi.yaml"), openApiYaml, "utf-8");
    logSuccess(`Generated OpenAPI 3.1 -> ${path.join("output", "openapi.yaml")}`);

    if (aiDocs) {
      await fs.writeFile(path.join(outputDir, "API_DOCS.md"), aiDocs, "utf-8");
      logSuccess(`Generated AI Docs -> ${path.join("output", "API_DOCS.md")}`);
    }

    console.log(`\n${pc.green(pc.bold("Build completed successfully!"))}\n`);
  } catch (err) {
    logError(formatError(err, outputDir));
    process.exit(1);
  }
}
