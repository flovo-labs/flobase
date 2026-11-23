import { describe, it, expect, vi } from "vitest";
import { formatError, logSuccess, logWarning, logError } from "../src/errors.js";

describe("Errors and Logging module", () => {
  it("formats standard string error cleanly", () => {
    const formatted = formatError("Custom error message", "test.yaml");
    expect(formatted).toContain("Custom error message.");
    expect(formatted).toContain("in test.yaml");
  });

  it("extracts line and column numbers from YAML errors", () => {
    const err = new Error("bad mapping at line 14, column 5: unexpected token");
    const formatted = formatError(err, "schema.yaml");
    expect(formatted).toContain("schema.yaml:14:5");
  });

  it("handles ENOENT and EACCES errors cleanly without raw stack traces", () => {
    const enoentErr = Object.assign(new Error("File missing"), { code: "ENOENT", path: "/path/to/file.yaml" });
    const formatted = formatError(enoentErr);
    expect(formatted).toContain("File not found at '/path/to/file.yaml'");
    expect(formatted).not.toContain("at Object.");

    const eaccesErr = Object.assign(new Error("No access"), { code: "EACCES", path: "/secret/file.yaml" });
    const formattedA = formatError(eaccesErr);
    expect(formattedA).toContain("Permission denied accessing '/secret/file.yaml'");
  });

  it("outputs stack trace only when DEBUG=1", () => {
    const originalDebug = process.env.DEBUG;
    try {
      process.env.DEBUG = "1";
      const err = new Error("Debug stack check");
      const formatted = formatError(err, "file.yaml");
      expect(formatted).toContain("Debug stack check");
      expect(formatted).toContain("Error: Debug stack check");
    } finally {
      process.env.DEBUG = originalDebug;
    }
  });

  it("calls console log functions cleanly", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logSuccess("Success test");
    logWarning("Warning test");
    logError("Error test");

    expect(consoleSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
    warnSpy.mockRestore();
    errSpy.mockRestore();
  });
});
