import { z } from "zod";
import { loadSchemaFile } from "../utils.js";

export const ReadSchemaInputSchema = {
  path: z.string().describe("Path to the schema.yaml file")
};

export async function handleReadSchema(args: { path: string }) {
  const loaded = await loadSchemaFile(args.path);
  if (!loaded.success) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              error: loaded.error,
              filePath: loaded.filePath
            },
            null,
            2
          )
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
          text: JSON.stringify(
            {
              success: false,
              filePath,
              errors: parsedResult.errors
            },
            null,
            2
          )
        }
      ],
      isError: true
    };
  }

  const schema = parsedResult.data;
  const models = schema.models || {};
  const modelEntries = Object.entries(models);

  // Generate structured human-readable summary
  const summaryLines: string[] = [];
  summaryLines.push(`# Schema Summary: ${schema.name || "Flobase"} (v${schema.version || "1.0"})`);
  if (schema.description) {
    summaryLines.push(`${schema.description}\n`);
  }
  summaryLines.push(`- **Total Models**: ${modelEntries.length}`);

  let totalRelationships = 0;
  for (const [, model] of modelEntries) {
    if (model.relationships) {
      totalRelationships += Object.keys(model.relationships).length;
    }
  }
  summaryLines.push(`- **Total Relationships**: ${totalRelationships}`);
  summaryLines.push(`- **Declared Endpoints**: ${schema.endpoints?.length || 0}\n`);

  summaryLines.push(`## Models Overview`);
  for (const [modelName, model] of modelEntries) {
    const fieldCount = Object.keys(model.fields || {}).length;
    const relCount = Object.keys(model.relationships || {}).length;
    const tableInfo = model.tableName ? ` (table: \`${model.tableName}\`)` : "";
    summaryLines.push(`### ${modelName}${tableInfo}`);
    if (model.description) {
      summaryLines.push(`> ${model.description}`);
    }
    summaryLines.push(`- **Fields (${fieldCount})**:`);
    for (const [fieldName, field] of Object.entries(model.fields || {})) {
      const flags: string[] = [];
      if (field.primaryKey) flags.push("PK");
      if (field.unique) flags.push("unique");
      if (field.required) flags.push("required");
      if (field.nullable) flags.push("nullable");
      if (field.references) flags.push(`fk -> ${field.references}`);
      if (field.default !== undefined) flags.push(`default: ${JSON.stringify(field.default)}`);
      
      const flagStr = flags.length > 0 ? ` [${flags.join(", ")}]` : "";
      const descStr = field.description ? ` - ${field.description}` : "";
      summaryLines.push(`  - \`${fieldName}\` (${field.type})${flagStr}${descStr}`);
    }

    if (model.relationships && Object.keys(model.relationships).length > 0) {
      summaryLines.push(`- **Relationships (${relCount})**:`);
      for (const [relName, rel] of Object.entries(model.relationships)) {
        summaryLines.push(
          `  - \`${relName}\`: ${rel.type} -> \`${rel.model}\`${
            rel.foreignKey ? ` (fk: ${rel.foreignKey})` : ""
          }${rel.through ? ` (through: ${rel.through})` : ""}`
        );
      }
    }
    summaryLines.push("");
  }

  if (schema.endpoints && schema.endpoints.length > 0) {
    summaryLines.push(`## Declared Endpoints`);
    for (const ep of schema.endpoints) {
      const authStr = ep.auth ? " [Auth Required]" : "";
      summaryLines.push(`- \`${ep.method} ${ep.path}\`${authStr}${ep.summary ? ` - ${ep.summary}` : ""}`);
    }
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            success: true,
            filePath,
            summary: summaryLines.join("\n"),
            schema
          },
          null,
          2
        )
      }
    ]
  };
}
