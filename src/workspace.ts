import * as fs from "fs/promises";
import * as path from "path";

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".turbo",
  ".cache",
  ".gemini"
]);

/**
 * Fast asynchronous discovery of schema files (*schema.yaml, *schema.yml)
 * with bounded depth to keep startup well under 200ms.
 */
export async function findSchemaFiles(
  startDir: string,
  maxDepth = 4,
  currentDepth = 0
): Promise<string[]> {
  if (currentDepth > maxDepth) return [];

  const results: string[] = [];
  try {
    const entries = await fs.readdir(startDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
          const subDirPath = path.join(startDir, entry.name);
          const subResults = await findSchemaFiles(subDirPath, maxDepth, currentDepth + 1);
          results.push(...subResults);
        }
      } else if (entry.isFile()) {
        const lower = entry.name.toLowerCase();
        if (
          lower === "schema.yaml" ||
          lower === "schema.yml" ||
          lower.endsWith(".schema.yaml") ||
          lower.endsWith(".schema.yml")
        ) {
          results.push(path.join(startDir, entry.name));
        }
      }
    }
  } catch {
    // Silently ignore directories that cannot be read
  }

  return results;
}
