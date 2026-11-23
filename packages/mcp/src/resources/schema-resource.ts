import * as fs from "fs/promises";
import * as path from "path";

export async function findSchemaFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist") {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const nested = await findSchemaFiles(fullPath);
        results.push(...nested);
      } else if (entry.name === "schema.yaml" || entry.name === "schema.yml") {
        results.push(fullPath);
      }
    }
  } catch {
    // Ignore read errors
  }
  return results;
}
