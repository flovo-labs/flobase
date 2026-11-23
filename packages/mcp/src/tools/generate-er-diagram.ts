import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { parseAndValidateSchema } from "flobase/schema";
import { generateMermaidEr } from "flobase/er-generator";

export const GenerateErDiagramInputSchema = z.object({
  path: z.string().describe("Path to schema.yaml file")
});

export async function handleGenerateErDiagram(input: z.infer<typeof GenerateErDiagramInputSchema>) {
  const fullPath = path.resolve(process.cwd(), input.path);
  const content = await fs.readFile(fullPath, "utf-8");
  const parsed = parseAndValidateSchema(content, fullPath);

  if (!parsed.success || !parsed.data) {
    throw new Error(`Invalid schema: ${parsed.errors.join("; ")}`);
  }

  const mermaid = generateMermaidEr(parsed.data);
  return { mermaid };
}
