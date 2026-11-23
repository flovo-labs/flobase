import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { parseAndValidateSchema } from "flobase/schema";
import { generatePostgresDDL } from "flobase/pg-generator";

export const GenerateSqlInputSchema = z.object({
  path: z.string().describe("Path to schema.yaml file"),
  dialect: z.enum(["postgres"]).default("postgres").describe("SQL dialect")
});

export async function handleGenerateSql(input: z.infer<typeof GenerateSqlInputSchema>) {
  const fullPath = path.resolve(process.cwd(), input.path);
  const content = await fs.readFile(fullPath, "utf-8");
  const parsed = parseAndValidateSchema(content, fullPath);

  if (!parsed.success || !parsed.data) {
    throw new Error(`Invalid schema: ${parsed.errors.join("; ")}`);
  }

  const sql = generatePostgresDDL(parsed.data);
  return { sql };
}
