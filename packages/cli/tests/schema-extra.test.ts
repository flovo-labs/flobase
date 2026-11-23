import { describe, it, expect } from "vitest";
import { parseAndValidateSchema } from "../src/schema.js";
import { generateMermaidEr } from "../src/er-generator.js";

describe("More schema and er generator coverage", () => {
  it("covers many-to-one, one-to-one, and many-to-many cardinality in ER generator", () => {
    const yaml = `
models:
  A:
    fields:
      id:
        type: uuid
        primary: true
    relationships:
      b1:
        type: one-to-one
        model: B
      b2:
        type: many-to-one
        model: B
      b3:
        type: many-to-many
        model: B
  B:
    fields:
      id:
        type: uuid
        primary: true
`;
    const parsed = parseAndValidateSchema(yaml);
    expect(parsed.success).toBe(true);
    const er = generateMermaidEr(parsed.data!);
    expect(er).toContain("||--||");
    expect(er).toContain("}o--||");
    expect(er).toContain("}o--o{");
  });

  it("checks model without fields or empty models", () => {
    const emptyModels = `
models: {}
`;
    const res = parseAndValidateSchema(emptyModels);
    expect(res.success).toBe(false);

    const modelNoFields = `
models:
  EmptyModel:
    fields: {}
`;
    const res2 = parseAndValidateSchema(modelNoFields);
    expect(res2.success).toBe(false);
  });
});
