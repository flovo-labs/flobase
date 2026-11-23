import { z } from "zod";
import * as yaml from "yaml";

/**
 * Standard Primitive Field Types supported across PostgreSQL and REST OpenAPI 3.1
 */
export const FieldTypeSchema = z.enum([
  "string",
  "text",
  "int",
  "integer",
  "float",
  "decimal",
  "bool",
  "boolean",
  "datetime",
  "timestamp",
  "date",
  "time",
  "uuid",
  "json",
  "enum"
]);
export type FieldType = z.infer<typeof FieldTypeSchema>;

/**
 * Field Definition
 */
export const FieldSchema = z.object({
  type: z.string().describe("Field data type (uuid, string, text, int, decimal, bool, timestamp, datetime, etc.)"),
  primaryKey: z.boolean().optional().describe("Whether this field is the primary key"),
  primary: z.boolean().optional().describe("Alias for primaryKey"),
  unique: z.boolean().optional().describe("Whether values must be unique across records"),
  nullable: z.boolean().optional().describe("Whether null is acceptable"),
  required: z.boolean().optional().describe("Whether value is required"),
  default: z.any().optional().describe("Default value if omitted"),
  description: z.string().optional().describe("Field documentation / purpose"),
  references: z.string().optional().describe("Foreign key target in TargetModel.field format (e.g. User.id)"),
  enum: z.array(z.string()).optional().describe("List of allowed enum string values if type is enum")
});
export type Field = z.infer<typeof FieldSchema>;

/**
 * Relationship cardinality
 */
export const RelationTypeSchema = z.enum([
  "one-to-one",
  "one-to-many",
  "many-to-one",
  "many-to-many"
]);
export type RelationType = z.infer<typeof RelationTypeSchema>;

/**
 * Model Relationship Definition
 */
export const RelationshipSchema = z.object({
  type: RelationTypeSchema.describe("Cardinality: one-to-one, one-to-many, many-to-one, or many-to-many"),
  model: z.string().describe("Target model name"),
  foreignKey: z.string().optional().describe("Foreign key field in this model or target model"),
  through: z.string().optional().describe("Join table name for many-to-many relations"),
  description: z.string().optional().describe("Description of relationship")
});
export type Relationship = z.infer<typeof RelationshipSchema>;

/**
 * Model Definition
 */
export const ModelSchema = z.object({
  description: z.string().optional().describe("Model description"),
  tableName: z.string().optional().describe("Underlying database table name"),
  fields: z.record(z.string(), FieldSchema).describe("Map of field names to field definitions"),
  relationships: z.record(z.string(), RelationshipSchema).optional().describe("Named relationships to other models"),
  indexes: z.array(z.union([z.string(), z.array(z.string())])).optional().describe("List of single or composite field indexes")
});
export type Model = z.infer<typeof ModelSchema>;

/**
 * HTTP Endpoint Definition (OpenAPI 3.1 compatible)
 */
export const EndpointSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).describe("HTTP method"),
  path: z.string().describe("Path route (e.g. /users/{id})"),
  summary: z.string().optional().describe("Short summary of endpoint purpose"),
  description: z.string().optional().describe("Detailed description"),
  model: z.string().optional().describe("Associated model"),
  auth: z.boolean().optional().describe("Requires authentication"),
  requestBody: z.any().optional().describe("Request payload schema or description"),
  response: z.any().optional().describe("Response structure")
});
export type Endpoint = z.infer<typeof EndpointSchema>;

/**
 * Complete Flobase Document Definition
 */
export const FlobaseDocument = z.object({
  version: z.union([z.string(), z.number()]).optional().describe("Flobase format version"),
  name: z.string().optional().describe("Schema or project name"),
  description: z.string().optional().describe("Schema overview description"),
  models: z.record(z.string(), ModelSchema, {
    required_error: "Missing required root property 'models'",
    invalid_type_error: "'models' must be an object map of Model definitions"
  }),
  endpoints: z.array(EndpointSchema).optional().describe("Declared API endpoints")
});
export type Flobase = z.infer<typeof FlobaseDocument>;

/**
 * Safe parser helper for Flobase that detects syntax errors and semantic errors,
 * including duplicate field definitions, missing target models, and invalid references.
 */
export function parseAndValidateSchema(rawYaml: string, filePath?: string): {
  success: boolean;
  data?: Flobase;
  errors: string[];
} {
  let parsed: unknown;
  const errors: string[] = [];

  // Check for duplicate keys in YAML source
  try {
    const cst = yaml.parseDocument(rawYaml, { prettyErrors: true });
    if (cst.errors && cst.errors.length > 0) {
      for (const err of cst.errors) {
        const line = err.linePos ? err.linePos[0].line : undefined;
        const col = err.linePos ? err.linePos[0].col : undefined;
        const loc = line ? ` (line ${line}, col ${col})` : "";
        errors.push(`YAML Syntax Error: ${err.message}${loc}`);
      }
      return { success: false, errors };
    }
    parsed = cst.toJS();
  } catch (err: any) {
    const lineMatch = err?.message?.match(/at line (\d+), column (\d+)/i);
    const loc = lineMatch ? ` (line ${lineMatch[1]}, col ${lineMatch[2]})` : "";
    return {
      success: false,
      errors: [`YAML Syntax Error: ${err?.message || String(err)}${loc}`]
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return {
      success: false,
      errors: ["Invalid YAML content: root must be an object mapping with 'models'."]
    };
  }

  // Parse with Zod
  const result = FlobaseDocument.safeParse(parsed);
  if (!result.success) {
    for (const e of result.error.errors) {
      const fieldPath = e.path.length > 0 ? `'${e.path.join(".")}'` : "root";
      errors.push(`Schema validation error at ${fieldPath}: ${e.message}`);
    }
    return { success: false, errors };
  }

  const schema = result.data;
  const modelNames = new Set(Object.keys(schema.models));

  if (modelNames.size === 0) {
    errors.push("Schema validation error: 'models' must define at least one model.");
    return { success: false, errors };
  }

  // Semantic verification: check relationships and foreign keys
  for (const [modelName, model] of Object.entries(schema.models)) {
    if (!model.fields || Object.keys(model.fields).length === 0) {
      errors.push(`Model '${modelName}' must have at least one field defined.`);
    }

    // Check relationship targets
    if (model.relationships) {
      for (const [relName, rel] of Object.entries(model.relationships)) {
        if (!modelNames.has(rel.model)) {
          errors.push(
            `Model '${modelName}', relationship '${relName}': references unknown target model '${rel.model}'.`
          );
        }
      }
    }

    // Check field references (e.g. references: User.id or User)
    if (model.fields) {
      for (const [fieldName, field] of Object.entries(model.fields)) {
        if (field.references) {
          const [targetModel, targetField] = field.references.split(".");
          if (!modelNames.has(targetModel)) {
            errors.push(
              `Model '${modelName}', field '${fieldName}': references unknown target model '${targetModel}' in '${field.references}'.`
            );
          } else if (targetField && !schema.models[targetModel].fields?.[targetField]) {
            errors.push(
              `Model '${modelName}', field '${fieldName}': target field '${targetField}' does not exist on model '${targetModel}'.`
            );
          }
        }
      }
    }
  }

  // Check endpoints associated models
  if (schema.endpoints) {
    for (const ep of schema.endpoints) {
      if (ep.model && !modelNames.has(ep.model)) {
        errors.push(`Endpoint '${ep.method} ${ep.path}': references unknown model '${ep.model}'.`);
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: schema,
    errors: []
  };
}
