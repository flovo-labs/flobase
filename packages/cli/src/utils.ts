import * as fs from "fs/promises";
import * as path from "path";
import { parseAndValidateSchema } from "./schema.js";

export interface LoadedSchemaResult {
  filePath: string;
  rawYaml: string;
  parsedResult: ReturnType<typeof parseAndValidateSchema>;
}

/**
 * Robustly reads schema file from disk without unhandled exceptions.
 * Returns single clear sentence errors when failure occurs.
 */
export async function loadSchemaFile(targetPath: string): Promise<
  | { success: true; data: LoadedSchemaResult }
  | { success: false; error: string; filePath: string }
> {
  const resolvedPath = path.resolve(process.cwd(), targetPath);

  try {
    const rawYaml = await fs.readFile(resolvedPath, "utf-8");
    const parsedResult = parseAndValidateSchema(rawYaml, resolvedPath);
    return {
      success: true,
      data: {
        filePath: resolvedPath,
        rawYaml,
        parsedResult
      }
    };
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return {
        success: false,
        error: `File not found at '${resolvedPath}'.`,
        filePath: resolvedPath
      };
    }
    if (err.code === "EACCES") {
      return {
        success: false,
        error: `Permission denied reading file at '${resolvedPath}'.`,
        filePath: resolvedPath
      };
    }
    return {
      success: false,
      error: `Failed to read schema file at '${resolvedPath}': ${err?.message || String(err)}.`,
      filePath: resolvedPath
    };
  }
}
