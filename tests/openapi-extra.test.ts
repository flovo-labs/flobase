import { describe, it, expect } from "vitest";
import { parseAndValidateSchema } from "../src/schema.js";
import { generateOpenApiSpec } from "../src/openapi-generator.js";

describe("OpenAPI Generator Edge Cases", () => {
  it("maps PUT, PATCH, and enum properties accurately", () => {
    const yamlStr = `
models:
  Item:
    fields:
      id:
        type: uuid
        primary: true
      status:
        type: enum
        enum: ["open", "closed"]
      details:
        type: json
      dueDate:
        type: date
      dueTime:
        type: time
endpoints:
  - method: PUT
    path: /items/{id}
    model: Item
  - method: PATCH
    path: /items/{id}
    model: Item
`;
    const parsed = parseAndValidateSchema(yamlStr);
    expect(parsed.success).toBe(true);

    const spec = generateOpenApiSpec(parsed.data!);
    expect(spec.paths["/items/{id}"].put).toBeDefined();
    expect(spec.paths["/items/{id}"].patch).toBeDefined();

    const props = spec.components.schemas.Item.properties;
    expect(props.status.enum).toEqual(["open", "closed"]);
    expect(props.details.type).toBe("object");
    expect(props.dueDate.format).toBe("date");
    expect(props.dueTime.format).toBe("time");
  });
});
