import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { parseAndValidateSchema } from "flobase/schema";

export const ReadSchemaInputSchema = z.object({
  path: z.string().describe("Path to schema.yaml file")
});

export async function handleReadSchema(input: z.infer<typeof ReadSchemaInputSchema>) {
  try {
    const fullPath = path.resolve(process.cwd(), input.path);
    const content = await fs.readFile(fullPath, "utf-8");
    const parsed = parseAndValidateSchema(content, fullPath);

    if (!parsed.success || !parsed.data) {
      return {
        valid: false,
        schema: {},
        summary: `Validation failed: ${parsed.errors.join("; ")}`
      };
    }

    const schema = parsed.data;
    const modelKeys = Object.keys(schema.models || {});
    const endpointCount = schema.endpoints?.length || 0;

    const summary = [
      `Schema: ${schema.name || "Flobase Schema"} (v${schema.version || "0.1.0"})`,
      `Models (${modelKeys.length}): ${modelKeys.join(", ") || "None"}`,
      `Endpoints: ${endpointCount} defined`
    ].join("\n");

    return {
      valid: true,
      schema,
      summary
    };
  } catch (err: any) {
    return {
      valid: false,
      schema: {},
      summary: `Failed to read schema file: ${err?.message || String(err)}`
    };
  }
}
