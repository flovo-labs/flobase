import { describe, it, expect } from "vitest";
import { parseAndValidateSchema } from "../src/schema.js";
import { generateMermaidEr } from "../src/er-generator.js";

const FIXTURE_SCHEMA = `
version: "0.1.0"
name: "BlogApp"
models:
  User:
    fields:
      id:
        type: uuid
        primary: true
        description: "User primary key"
      email:
        type: string
        unique: true
      name:
        type: string
    relationships:
      articles:
        type: one-to-many
        model: Article
        foreignKey: authorId

  Article:
    fields:
      id:
        type: uuid
        primary: true
      authorId:
        type: uuid
        references: "User.id"
      title:
        type: string
      published:
        type: bool
        default: false
`;

describe("Mermaid ER Diagram Generator", () => {
  it("deterministically generates identical Mermaid ER diagram snapshot", () => {
    const res = parseAndValidateSchema(FIXTURE_SCHEMA);
    expect(res.success).toBe(true);
    const diagram = generateMermaidEr(res.data!);

    expect(diagram).toMatchInlineSnapshot(`
      "erDiagram
          User {
              uuid id PK "User primary key"
              string email
              string name
          }
          Article {
              uuid id PK
              uuid authorId FK
              string title
              bool published
          }

          User ||--o{ Article : "articles"
          User ||--o{ Article : "authorId"
      "
    `);
  });

  it("handles empty relationships gracefully", () => {
    const singleModelYaml = `
models:
  Tag:
    fields:
      id:
        type: int
        primaryKey: true
      name:
        type: string
`;
    const res = parseAndValidateSchema(singleModelYaml);
    expect(res.success).toBe(true);
    const diagram = generateMermaidEr(res.data!);
    expect(diagram).toContain("erDiagram");
    expect(diagram).toContain("Tag {");
    expect(diagram).toContain("int id PK");
  });
});
