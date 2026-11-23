import pc from "picocolors";

export interface FormattedError {
  message: string;
  filePath?: string;
  line?: number;
  column?: number;
  raw?: unknown;
}

/**
 * Format error into a clear sentence with file path and line number when possible.
 * Appends raw stack traces only if DEBUG=1.
 */
export function formatError(err: unknown, defaultFilePath?: string): string {
  const isDebug = process.env.DEBUG === "1" || process.env.DEBUG === "true";

  if (!err) {
    return pc.red("[ERROR] Unknown error occurred.");
  }

  let message = "";
  let filePath = defaultFilePath;
  let line: number | undefined;
  let column: number | undefined;

  if (typeof err === "string") {
    message = err;
  } else if (err instanceof Error) {
    message = err.message;

    // Check for YAML parse errors or Line/Column patterns
    const yamlMatch = message.match(/at line (\d+), column (\d+)/i);
    if (yamlMatch) {
      line = parseInt(yamlMatch[1], 10);
      column = parseInt(yamlMatch[2], 10);
    }

    // Check for ENOENT or standard node errors
    if ((err as any).code === "ENOENT") {
      const p = (err as any).path || filePath || "unknown";
      message = `File not found at '${p}'.`;
    } else if ((err as any).code === "EACCES") {
      const p = (err as any).path || filePath || "unknown";
      message = `Permission denied accessing '${p}'.`;
    }
  } else if (typeof err === "object") {
    message = JSON.stringify(err);
  }

  // Clean trailing punctuation or newlines
  message = message.trim().replace(/\r?\n.*$/s, "");
  if (!message.endsWith(".")) {
    message += ".";
  }

  let locationStr = "";
  if (filePath) {
    locationStr = ` in ${filePath}`;
    if (line !== undefined) {
      locationStr += `:${line}`;
      if (column !== undefined) {
        locationStr += `:${column}`;
      }
    }
  }

  const formatted = `${pc.red("[ERROR]")} ${message}${locationStr}`;

  if (isDebug && err instanceof Error && err.stack) {
    return `${formatted}\n\n${pc.gray(err.stack)}`;
  }

  return formatted;
}

export function logSuccess(msg: string): void {
  console.log(`${pc.green("Success:")} ${msg}`);
}

export function logWarning(msg: string): void {
  console.warn(`${pc.yellow("[WARN]")} ${msg}`);
}

export function logError(msg: string): void {
  console.error(pc.red(msg.startsWith("[ERROR]") ? msg : `[ERROR] ${msg}`));
}
