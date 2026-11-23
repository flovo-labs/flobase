import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { parseAndValidateSchema } from "flobase/schema";

export const ValidateSchemaInputSchema = z.object({
  path: z.string().describe("Path to schema.yaml file")
});

export async function handleValidateSchema(input: z.infer<typeof ValidateSchemaInputSchema>) {
  try {
    const fullPath = path.resolve(process.cwd(), input.path);
    const content = await fs.readFile(fullPath, "utf-8");
    const parsed = parseAndValidateSchema(content, fullPath);

    if (parsed.success) {
      return {
        valid: true,
        errors: []
      };
    }

    return {
      valid: false,
      errors: parsed.errors.map((msg: string) => ({
        path: input.path,
        message: msg
      }))
    };
  } catch (err: any) {
    return {
      valid: false,
      errors: [
        {
          path: input.path,
          message: err?.message || String(err)
        }
      ]
    };
  }
}
