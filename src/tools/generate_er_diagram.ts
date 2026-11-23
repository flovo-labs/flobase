import { execFile } from "child_process";
import { promisify } from "util";
import { z } from "zod";
import { loadSchemaFile } from "../utils.js";
import { Flobase } from "../schema.js";

const execFileAsync = promisify(execFile);

export const GenerateErDiagramInputSchema = {
  path: z.string().describe("Path to the schema.yaml file")
};

/**
 * Deterministic inline ER diagram generation following Mermaid erDiagram syntax.
 * Cardinality notation in Mermaid:
 *   one-to-one:   ||--||
 *   one-to-many:  ||--o{ or ||--|{ (using ||--o{ for optional child)
 *   many-to-one:  }o--||
 *   many-to-many: }o--o{
 */
export function generateInlineMermaidEr(schema: Flobase): string {
  const lines: string[] = ["erDiagram"];
  const models = schema.models || {};
  const relationsDrawn = new Set<string>();

  // 1. Define entities and their attributes
  for (const [modelName, model] of Object.entries(models)) {
    lines.push(`    ${modelName} {`);
    for (const [fieldName, field] of Object.entries(model.fields || {})) {
      // Clean type string (remove spaces, special chars)
      const sanitizedType = (field.type || "string").replace(/[^a-zA-Z0-9_]/g, "_");
      const pkOrFk = field.primaryKey ? "PK" : field.references ? "FK" : "";
      const comment = field.description ? ` "${field.description.replace(/"/g, "'")}"` : "";
      lines.push(`        ${sanitizedType} ${fieldName}${pkOrFk ? ` ${pkOrFk}` : ""}${comment}`);
    }
    lines.push(`    }`);
  }

  lines.push("");

  // 2. Render relationships from explicit relationship declarations
  for (const [sourceModel, model] of Object.entries(models)) {
    if (!model.relationships) continue;
    for (const [relName, rel] of Object.entries(model.relationships)) {
      const targetModel = rel.model;
      if (!targetModel) continue;

      // Unique relationship key to prevent duplicates if bidirectional
      const relationKey = [sourceModel, targetModel, relName].sort().join("::");
      if (relationsDrawn.has(relationKey)) continue;
      relationsDrawn.add(relationKey);

      let arrow = "||--o{"; // default one-to-many
      switch (rel.type) {
        case "one-to-one":
          arrow = "||--||";
          break;
        case "one-to-many":
          arrow = "||--o{";
          break;
        case "many-to-one":
          arrow = "}o--||";
          break;
        case "many-to-many":
          arrow = "}o--o{";
          break;
      }

      const label = relName || "relates";
      lines.push(`    ${sourceModel} ${arrow} ${targetModel} : "${label}"`);
    }
  }

  // 3. Render inferred relationships from field references (e.g., references: User.id)
  for (const [sourceModel, model] of Object.entries(models)) {
    for (const [fieldName, field] of Object.entries(model.fields || {})) {
      if (field.references) {
        const parts = field.references.split(".");
        const targetModel = parts[0];
        if (targetModel && models[targetModel]) {
          const relationKey = [sourceModel, targetModel, fieldName].sort().join("::");
          if (!relationsDrawn.has(relationKey)) {
            relationsDrawn.add(relationKey);
            lines.push(`    ${targetModel} ||--o{ ${sourceModel} : "${fieldName}"`);
          }
        }
      }
    }
  }

  return lines.join("\n");
}

export async function handleGenerateErDiagram(args: { path: string }) {
  const loaded = await loadSchemaFile(args.path);
  if (!loaded.success) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${loaded.error}`
        }
      ],
      isError: true
    };
  }

  const { parsedResult, filePath } = loaded.data;
  if (!parsedResult.success || !parsedResult.data) {
    return {
      content: [
        {
          type: "text",
          text: `Schema validation failed for ${filePath}:\n${parsedResult.errors.join("\n")}`
        }
      ],
      isError: true
    };
  }

  // Check if flobase CLI is installed and available
  try {
    const { stdout } = await execFileAsync("flobase", ["generate", "er", filePath], {
      timeout: 3000
    });
    if (stdout && stdout.trim().length > 0) {
      return {
        content: [
          {
            type: "text",
            text: stdout.trim()
          }
        ]
      };
    }
  } catch {
    // flobase CLI not installed or failed - fallback to deterministic inline generator
  }

  // Fast, deterministic standalone inline generator
  const mermaidDiagram = generateInlineMermaidEr(parsedResult.data);
  return {
    content: [
      {
        type: "text",
        text: mermaidDiagram
      }
    ]
  };
}
