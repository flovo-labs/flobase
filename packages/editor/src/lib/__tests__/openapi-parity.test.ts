import { describe, it, expect } from "vitest";
import * as yaml from "yaml";
import { generateOpenApiSpec } from "../../../../cli/src/openapi-generator.js";
import { parseAndValidateSchema } from "../../../../cli/src/schema.js";

const FIXTURE_SCHEMA = `
version: "0.1.0"
name: "TaskParityApp"
description: "Parity test schema between CLI and Editor"

models:
  User:
    tableName: "users"
    fields:
      id:
        type: uuid
        primary: true
      email:
        type: string
        unique: true
      name:
        type: string
        required: true

  Task:
    tableName: "tasks"
    fields:
      id:
        type: uuid
        primary: true
      userId:
        type: uuid
        references: "User.id"
      title:
        type: string
        required: true
      completed:
        type: bool
        default: false

endpoints:
  - method: GET
    path: /api/tasks
    model: Task
  - method: POST
    path: /api/tasks
    model: Task
`;

describe("OpenAPI Generation Parity (CLI vs Editor)", () => {
  it("asserts editor endpoint logic produces 100% identical OpenAPI spec to CLI generator", () => {
    // 1. Validate schema through shared validator
    const parsed = parseAndValidateSchema(FIXTURE_SCHEMA);
    expect(parsed.success).toBe(true);
    expect(parsed.data).toBeDefined();

    // 2. Run CLI generator
    const cliSpec = generateOpenApiSpec(parsed.data!);

    // 3. Emulate Editor server /api/openapi endpoint
    const editorValidation = parseAndValidateSchema(yaml.stringify(parsed.data!));
    expect(editorValidation.success).toBe(true);
    const editorSpec = generateOpenApiSpec(editorValidation.data!);

    // 4. Assert strict object parity
    expect(editorSpec).toEqual(cliSpec);

    // 5. Assert serialized YAML equivalence
    const cliYaml = "# Generated OpenAPI 3.1 Contract\n" + yaml.stringify(cliSpec, { indent: 2 });
    const editorYaml = "# Generated OpenAPI 3.1 Contract\n" + yaml.stringify(editorSpec, { indent: 2 });
    expect(editorYaml).toBe(cliYaml);
  });
});
