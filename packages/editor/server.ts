import express from "express";
import cors from "cors";
import * as fs from "fs/promises";
import * as path from "path";
import * as yaml from "yaml";
import { parseAndValidateSchema } from "../cli/src/schema.js";
import { generateOpenApiSpec } from "../cli/src/openapi-generator.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Target schema path passed from CLI or default to schema.yaml in current directory
const targetSchemaPath = path.resolve(
  process.cwd(),
  process.env.FLOBASE_SCHEMA_PATH || process.env.UNISCHEMA_SCHEMA_PATH || "schema.yaml"
);

/**
 * Updates a yaml.Document AST granularly using setIn to keep all existing comments intact
 */
export function updateDocGranularly(doc: yaml.Document, schema: any): void {
  doc.setIn(["version"], schema.version || "0.1.0");
  if (schema.name) doc.setIn(["name"], schema.name);
  if (schema.description) doc.setIn(["description"], schema.description);

  if (schema.models) {
    for (const [modelName, modelDef] of Object.entries<any>(schema.models)) {
      if (modelDef.tableName) {
        doc.setIn(["models", modelName, "tableName"], modelDef.tableName);
      }
      if (modelDef.fields) {
        for (const [fieldName, fieldDef] of Object.entries<any>(modelDef.fields)) {
          doc.setIn(["models", modelName, "fields", fieldName], fieldDef);
        }
      }
      if (modelDef.relationships) {
        doc.setIn(["models", modelName, "relationships"], modelDef.relationships);
      }
    }
  }

  if (schema.endpoints) {
    doc.setIn(["endpoints"], schema.endpoints);
  }
}

/**
 * GET /api/schema
 * Reads schema.yaml from disk and returns parsed JSON object
 */
app.get("/api/schema", async (_req, res) => {
  try {
    const rawYaml = await fs.readFile(targetSchemaPath, "utf-8");
    const parsedDoc = yaml.parseDocument(rawYaml);
    res.json({
      success: true,
      path: targetSchemaPath,
      schema: parsedDoc.toJS()
    });
  } catch (err: any) {
    if (err.code === "ENOENT") {
      res.status(404).json({
        success: false,
        error: `Schema file not found at '${targetSchemaPath}'. Run 'flobase init' first.`
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: `Failed to read schema file: ${err.message}`
    });
  }
});

/**
 * PUT /api/schema
 * Validates and writes updated schema back to disk while preserving comments
 */
app.put("/api/schema", async (req, res) => {
  const { schema, sequence } = req.body;
  if (!schema || typeof schema !== "object") {
    res.status(400).json({
      success: false,
      error: "Invalid request payload: 'schema' object is required.",
      sequence
    });
    return;
  }

  // 1. Validate with existing Zod schema
  const validation = parseAndValidateSchema(yaml.stringify(schema));
  if (!validation.success) {
    res.status(422).json({
      success: false,
      errors: validation.errors,
      sequence
    });
    return;
  }

  // 2. High-fidelity comment-preserving write using yaml.parseDocument and setIn
  try {
    let doc: yaml.Document;
    try {
      const existingYaml = await fs.readFile(targetSchemaPath, "utf-8");
      doc = yaml.parseDocument(existingYaml);
      updateDocGranularly(doc, schema);
    } catch {
      doc = new yaml.Document(schema);
    }

    await fs.writeFile(targetSchemaPath, doc.toString(), "utf-8");
    res.json({
      success: true,
      message: "Schema updated successfully.",
      sequence
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Failed to write schema to '${targetSchemaPath}': ${err.message}`,
      sequence
    });
  }
});

/**
 * POST /api/validate
 * Validates a schema object against the official Zod and semantic checks
 */
app.post("/api/validate", (req, res) => {
  const { schema } = req.body;
  if (!schema || typeof schema !== "object") {
    res.status(400).json({ valid: false, errors: ["Missing schema payload"] });
    return;
  }

  const validation = parseAndValidateSchema(yaml.stringify(schema));
  res.json({
    valid: validation.success,
    errors: validation.errors
  });
});

/**
 * POST /api/openapi
 * Generates OpenAPI 3.1 YAML contract directly using the CLI generator
 */
app.post("/api/openapi", (req, res) => {
  const { schema } = req.body;
  if (!schema || typeof schema !== "object") {
    res.status(400).json({ openapi: "", errors: ["Missing schema payload"] });
    return;
  }

  const validation = parseAndValidateSchema(yaml.stringify(schema));
  if (!validation.success || !validation.data) {
    res.json({
      openapi: "",
      errors: validation.errors
    });
    return;
  }

  try {
    const spec = generateOpenApiSpec(validation.data);
    const openapiYaml = "# Generated OpenAPI 3.1 Contract\n" + yaml.stringify(spec, { indent: 2 });
    res.json({
      openapi: openapiYaml,
      errors: []
    });
  } catch (err: any) {
    res.status(500).json({
      openapi: "",
      errors: [`OpenAPI generation failed: ${err.message}`]
    });
  }
});

// Avoid port collision: fail-fast on port in use or allow environment override
const server = app.listen(PORT, () => {
  console.log(`[Flobase Editor Server] Ready at http://localhost:${PORT}`);
  console.log(`[Flobase Editor Server] Bound to: ${targetSchemaPath}`);
});

server.on("error", (err: any) => {
  if (err.code === "EADDRINUSE") {
    console.error(`[ERROR] Port ${PORT} is already in use. Please free port ${PORT} or specify PORT=xxx.`);
    process.exit(1);
  }
});
