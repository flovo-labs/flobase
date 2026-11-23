import { describe, it, expect } from "vitest";
import { formatError } from "../src/errors.js";
import { parseAndValidateSchema } from "../src/schema.js";

describe("Branch coverage boosters", () => {
  it("covers formatError with null/falsy, object without message, and string without period", () => {
    expect(formatError(null)).toContain("Unknown error occurred");
    expect(formatError({ code: 500 })).toContain('{"code":500}');
    expect(formatError("Hello world")).toContain("Hello world.");
  });

  it("covers endpoint referencing non-existent model and non-object yaml root", () => {
    const invalidYaml = `
models:
  User:
    fields:
      id:
        type: uuid
        primary: true
endpoints:
  - method: GET
    path: /api/missing
    model: UnknownModel
`;
    const res = parseAndValidateSchema(invalidYaml);
    expect(res.success).toBe(false);
    expect(res.errors.some((e) => e.includes("UnknownModel"))).toBe(true);

    const scalarYaml = `Just a plain string`;
    const resScalar = parseAndValidateSchema(scalarYaml);
    expect(resScalar.success).toBe(false);
    expect(resScalar.errors.some((e) => e.includes("Invalid YAML content"))).toBe(true);
  });
});
