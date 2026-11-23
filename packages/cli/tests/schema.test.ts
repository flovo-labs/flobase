import { describe, it, expect } from "vitest";
import { parseAndValidateSchema } from "../src/schema.js";

describe("Schema Validation (Zod + Semantics)", () => {
  it("validates a well-formed schema correctly", () => {
    const validYaml = `
version: "0.1.0"
name: "TestApp"
models:
  User:
    fields:
      id:
        type: uuid
        primary: true
      email:
        type: string
        unique: true
`;
    const res = parseAndValidateSchema(validYaml);
    expect(res.success).toBe(true);
    expect(res.data?.models.User).toBeDefined();
    expect(res.errors).toHaveLength(0);
  });

  it("fails when 'models' root property is missing", () => {
    const invalidYaml = `
version: "0.1.0"
name: "MissingModels"
`;
    const res = parseAndValidateSchema(invalidYaml);
    expect(res.success).toBe(false);
    expect(res.errors.some((e) => e.includes("models"))).toBe(true);
  });

  it("fails when relationship targets an unknown model", () => {
    const badRelationYaml = `
version: "0.1.0"
models:
  User:
    fields:
      id:
        type: uuid
        primary: true
    relationships:
      posts:
        type: one-to-many
        model: NonExistentPost
`;
    const res = parseAndValidateSchema(badRelationYaml);
    expect(res.success).toBe(false);
    expect(res.errors.some((e) => e.includes("NonExistentPost"))).toBe(true);
  });

  it("fails when a foreign key references an unknown target model or field", () => {
    const badFkYaml = `
version: "0.1.0"
models:
  User:
    fields:
      id:
        type: uuid
        primary: true
  Post:
    fields:
      id:
        type: uuid
        primary: true
      authorId:
        type: uuid
        references: "User.invalidField"
`;
    const res = parseAndValidateSchema(badFkYaml);
    expect(res.success).toBe(false);
    expect(res.errors.some((e) => e.includes("invalidField"))).toBe(true);
  });

  it("fails on duplicate field or YAML parse errors", () => {
    const duplicateKeyYaml = `
version: "0.1.0"
models:
  User:
    fields:
      id:
        type: uuid
      id:
        type: string
`;
    const res = parseAndValidateSchema(duplicateKeyYaml);
    expect(res.success).toBe(false);
    expect(res.errors.some((e) => e.toLowerCase().includes("duplicate") || e.includes("YAML"))).toBe(true);
  });
});
