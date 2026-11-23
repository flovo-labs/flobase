import { describe, it, expect } from "vitest";
import * as yaml from "yaml";
import { updateDocGranularly } from "../../../server.js";

describe("Issue 1: Round-trip fidelity preserving YAML comments", () => {
  it("preserves comments when updating schema with parseDocument setIn", () => {
    const originalYaml = `# Top level comment
version: "0.1.0"
name: "TaskApp" # inline name comment

# Important Model Comment
models:
  # User documentation
  User:
    tableName: "users"
    fields:
      id:
        type: uuid
        primary: true
`;

    // 1. Parse document preserving comments
    const doc = yaml.parseDocument(originalYaml);

    // 2. Perform modification via updateDocGranularly
    const updatedSchema = {
      version: "0.1.0",
      models: {
        User: {
          tableName: "users",
          fields: {
            id: { type: "uuid", primary: true },
            name: { type: "string" }
          }
        }
      }
    };

    updateDocGranularly(doc, updatedSchema);

    const serialized = doc.toString();

    // 3. Verify comments are retained
    expect(serialized).toContain("# Top level comment");
    expect(serialized).toContain("# Important Model Comment");
    expect(serialized).toContain("# User documentation");
    expect(serialized).toContain("name:");
  });
});
