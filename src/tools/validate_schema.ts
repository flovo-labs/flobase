import { z } from "zod";
import { loadSchemaFile } from "../utils.js";

export const ValidateSchemaInputSchema = {
  path: z.string().describe("Path to the schema.yaml file")
};

export async function handleValidateSchema(args: { path: string }) {
  const loaded = await loadSchemaFile(args.path);
  if (!loaded.success) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              valid: false,
              errors: [loaded.error],
              filePath: loaded.filePath
            },
            null,
            2
          )
        }
      ]
    };
  }

  const { parsedResult, filePath } = loaded.data;
  const semanticErrors: string[] = [...parsedResult.errors];

  // If Zod parsed successfully, do additional semantic checks:
  // e.g. verify relationship target models and reference field targets exist
  if (parsedResult.success && parsedResult.data) {
    const models = parsedResult.data.models;
    const modelNames = new Set(Object.keys(models));

    for (const [modelName, model] of Object.entries(models)) {
      // Check relationship targets
      if (model.relationships) {
        for (const [relName, rel] of Object.entries(model.relationships)) {
          if (!modelNames.has(rel.model)) {
            semanticErrors.push(
              `Model '${modelName}', relationship '${relName}': references unknown target model '${rel.model}'`
            );
          }
        }
      }

      // Check field reference targets (e.g., 'User.id')
      if (model.fields) {
        for (const [fieldName, field] of Object.entries(model.fields)) {
          if (field.references) {
            const [targetModel, targetField] = field.references.split(".");
            if (!modelNames.has(targetModel)) {
              semanticErrors.push(
                `Model '${modelName}', field '${fieldName}': references unknown target model '${targetModel}' in '${field.references}'`
              );
            } else if (targetField && !models[targetModel].fields?.[targetField]) {
              semanticErrors.push(
                `Model '${modelName}', field '${fieldName}': target field '${targetField}' does not exist on model '${targetModel}'`
              );
            }
          }
        }
      }
    }
  }

  const valid = semanticErrors.length === 0;

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            valid,
            errors: semanticErrors,
            filePath
          },
          null,
          2
        )
      }
    ]
  };
}
