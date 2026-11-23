import { describe, it, expect } from "vitest";
import { parseAndValidateSchema } from "../src/schema.js";
import { generatePostgresDDL, mapFieldToPostgresType } from "../src/pg-generator.js";

describe("PostgreSQL Generator Edge Cases", () => {
  it("maps various field types and constraints accurately", () => {
    expect(mapFieldToPostgresType({ type: "uuid" })).toBe("UUID");
    expect(mapFieldToPostgresType({ type: "int" })).toBe("INTEGER");
    expect(mapFieldToPostgresType({ type: "float" })).toBe("DOUBLE PRECISION");
    expect(mapFieldToPostgresType({ type: "decimal" })).toBe("NUMERIC(19,4)");
    expect(mapFieldToPostgresType({ type: "bool" })).toBe("BOOLEAN");
    expect(mapFieldToPostgresType({ type: "timestamp" })).toBe("TIMESTAMPTZ");
    expect(mapFieldToPostgresType({ type: "date" })).toBe("DATE");
    expect(mapFieldToPostgresType({ type: "time" })).toBe("TIME");
    expect(mapFieldToPostgresType({ type: "json" })).toBe("JSONB");
    expect(mapFieldToPostgresType({ type: "enum", enum: ["a", "b"] })).toBe("TEXT");
  });

  it("handles indexes and default literals", () => {
    const schemaYaml = `
models:
  Account:
    tableName: "accounts"
    indexes:
      - "email"
      - ["username", "status"]
    fields:
      id:
        type: uuid
        primary: true
      email:
        type: string
        default: "none@example.com"
      username:
        type: string
      status:
        type: enum
        enum: ["active", "suspended"]
        default: "active"
      score:
        type: int
        default: 100
      nullableNote:
        type: string
        default: null
`;
    const parsed = parseAndValidateSchema(schemaYaml);
    expect(parsed.success).toBe(true);
    const ddl = generatePostgresDDL(parsed.data!);

    expect(ddl).toContain("CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts (email);");
    expect(ddl).toContain("CREATE INDEX IF NOT EXISTS idx_accounts_username_status ON accounts (username, status);");
    expect(ddl).toContain("DEFAULT 'none@example.com'");
    expect(ddl).toContain("DEFAULT 100");
    expect(ddl).toContain("DEFAULT NULL");
    expect(ddl).toContain("CHECK (status IN ('active', 'suspended'))");
  });
});
