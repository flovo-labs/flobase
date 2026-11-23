import { z } from "zod";
import { loadSchemaFile } from "../utils.js";
import { Flobase } from "../schema.js";

export const SuggestEndpointsInputSchema = {
  path: z.string().describe("Path to the schema.yaml file")
};

export interface SuggestedEndpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  operationId: string;
  summary: string;
  model: string;
  type: "REST" | "GraphQL";
  graphqlQueryOrMutation?: string;
}

/**
 * Deterministic heuristic to generate REST and GraphQL endpoints from schema models
 */
export function deriveEndpointsFromSchema(schema: Flobase): SuggestedEndpoint[] {
  const suggestions: SuggestedEndpoint[] = [];
  const models = schema.models || {};

  for (const [modelName, model] of Object.entries(models)) {
    // Determine kebab-cased plural resource name: e.g. User -> users, OrderItem -> order-items
    const pluralName = toPluralResource(modelName);
    const singularName = toLowerCamel(modelName);

    // Primary key detection
    let pkName = "id";
    for (const [fieldName, field] of Object.entries(model.fields || {})) {
      if (field.primaryKey) {
        pkName = fieldName;
        break;
      }
    }

    // 1. List / Pagination / Filtering
    suggestions.push({
      method: "GET",
      path: `/api/${pluralName}`,
      operationId: `list${capitalize(pluralName)}`,
      summary: `List and filter ${pluralName} with pagination`,
      model: modelName,
      type: "REST"
    });

    // 2. Create
    suggestions.push({
      method: "POST",
      path: `/api/${pluralName}`,
      operationId: `create${modelName}`,
      summary: `Create a new ${modelName}`,
      model: modelName,
      type: "REST"
    });

    // 3. Get by ID
    suggestions.push({
      method: "GET",
      path: `/api/${pluralName}/{${pkName}}`,
      operationId: `get${modelName}ById`,
      summary: `Retrieve a single ${modelName} by ${pkName}`,
      model: modelName,
      type: "REST"
    });

    // 4. Update (PUT - full replace)
    suggestions.push({
      method: "PUT",
      path: `/api/${pluralName}/{${pkName}}`,
      operationId: `update${modelName}`,
      summary: `Update all attributes of ${modelName}`,
      model: modelName,
      type: "REST"
    });

    // 5. Partial Update (PATCH)
    suggestions.push({
      method: "PATCH",
      path: `/api/${pluralName}/{${pkName}}`,
      operationId: `patch${modelName}`,
      summary: `Partially update attributes of ${modelName}`,
      model: modelName,
      type: "REST"
    });

    // 6. Delete
    suggestions.push({
      method: "DELETE",
      path: `/api/${pluralName}/{${pkName}}`,
      operationId: `delete${modelName}`,
      summary: `Delete a ${modelName} by ${pkName}`,
      model: modelName,
      type: "REST"
    });

    // 7. Relationship Sub-resources
    if (model.relationships) {
      for (const [relName, rel] of Object.entries(model.relationships)) {
        const relPlural = toPluralResource(rel.model || relName);
        if (rel.type === "one-to-many" || rel.type === "many-to-many") {
          suggestions.push({
            method: "GET",
            path: `/api/${pluralName}/{${pkName}}/${relPlural}`,
            operationId: `get${modelName}${capitalize(relPlural)}`,
            summary: `Get all ${relPlural} related to this ${modelName}`,
            model: modelName,
            type: "REST"
          });
          suggestions.push({
            method: "POST",
            path: `/api/${pluralName}/{${pkName}}/${relPlural}`,
            operationId: `create${modelName}${capitalize(rel.model || relName)}`,
            summary: `Create or associate ${rel.model} for this ${modelName}`,
            model: modelName,
            type: "REST"
          });
        } else {
          // one-to-one / many-to-one
          suggestions.push({
            method: "GET",
            path: `/api/${pluralName}/{${pkName}}/${toKebabCase(relName)}`,
            operationId: `get${modelName}${capitalize(relName)}`,
            summary: `Get associated ${rel.model} for this ${modelName}`,
            model: modelName,
            type: "REST"
          });
        }
      }
    }

    // 8. GraphQL Equivalents
    suggestions.push({
      method: "POST",
      path: "/graphql",
      operationId: `${singularName}Query`,
      summary: `GraphQL query: ${singularName}(${pkName}: ID!) and ${pluralName}(limit: Int, offset: Int)`,
      model: modelName,
      type: "GraphQL",
      graphqlQueryOrMutation: `query { ${singularName}(${pkName}: ID!): ${modelName}, ${pluralName}(limit: Int, offset: Int): [${modelName}!]! }`
    });
    suggestions.push({
      method: "POST",
      path: "/graphql",
      operationId: `${singularName}Mutations`,
      summary: `GraphQL mutations: create${modelName}, update${modelName}, delete${modelName}`,
      model: modelName,
      type: "GraphQL",
      graphqlQueryOrMutation: `mutation { create${modelName}(input: Create${modelName}Input!): ${modelName}!, update${modelName}(${pkName}: ID!, input: Update${modelName}Input!): ${modelName}!, delete${modelName}(${pkName}: ID!): Boolean! }`
    });
  }

  return suggestions;
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function toPluralResource(str: string): string {
  const kebab = toKebabCase(str);
  if (kebab.endsWith("y") && !kebab.endsWith("ey") && !kebab.endsWith("ay") && !kebab.endsWith("oy")) {
    return kebab.slice(0, -1) + "ies";
  }
  if (kebab.endsWith("s") || kebab.endsWith("ch") || kebab.endsWith("sh") || kebab.endsWith("x")) {
    return kebab + "es";
  }
  return kebab + "s";
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toLowerCamel(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export async function handleSuggestEndpoints(args: { path: string }) {
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

  const suggestedEndpoints = deriveEndpointsFromSchema(parsedResult.data);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            success: true,
            filePath,
            totalEndpoints: suggestedEndpoints.length,
            endpoints: suggestedEndpoints
          },
          null,
          2
        )
      }
    ]
  };
}
