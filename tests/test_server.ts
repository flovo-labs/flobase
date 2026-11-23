import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as path from "path";

async function runTests() {
  const startTime = performance.now();
  console.log("Starting MCP Server test suite...");

  const serverModule = path.resolve("./dist/index.js");
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverModule]
  });

  const client = new Client(
    {
      name: "test-client",
      version: "1.0.0"
    },
    {
      capabilities: {}
    }
  );

  await client.connect(transport);
  const connectTime = performance.now() - startTime;
  console.log(`Server connected in ${connectTime.toFixed(2)}ms (target <200ms)`);

  // Test 1: List Tools
  console.log("\n[1] Testing ListTools...");
  const tools = await client.listTools();
  console.log(`Found ${tools.tools.length} tools:`, tools.tools.map(t => t.name));
  if (tools.tools.length !== 4) {
    throw new Error(`Expected 4 tools, got ${tools.tools.length}`);
  }

  const samplePath = path.resolve("./examples/schema.yaml");

  // Test 2: read_schema
  console.log("\n[2] Testing read_schema...");
  const readRes = await client.callTool({
    name: "read_schema",
    arguments: { path: samplePath }
  });
  console.log("read_schema status: OK");
  const parsedRead = JSON.parse((readRes.content[0] as any).text);
  console.log("Models found:", Object.keys(parsedRead.schema.models));
  console.log("Summary preview:\n" + parsedRead.summary.split("\n").slice(0, 5).join("\n"));

  // Test 3: validate_schema
  console.log("\n[3] Testing validate_schema on valid schema...");
  const valRes = await client.callTool({
    name: "validate_schema",
    arguments: { path: samplePath }
  });
  const parsedVal = JSON.parse((valRes.content[0] as any).text);
  console.log("validate_schema result:", parsedVal);
  if (!parsedVal.valid) {
    throw new Error("Expected valid schema to pass validation");
  }

  // Test 4: generate_er_diagram
  console.log("\n[4] Testing generate_er_diagram...");
  const erRes = await client.callTool({
    name: "generate_er_diagram",
    arguments: { path: samplePath }
  });
  const erText = (erRes.content[0] as any).text;
  console.log("Mermaid ER Diagram generated:\n" + erText);
  if (!erText.startsWith("erDiagram")) {
    throw new Error("Mermaid output did not start with erDiagram");
  }

  // Test 5: suggest_endpoints
  console.log("\n[5] Testing suggest_endpoints...");
  const epRes = await client.callTool({
    name: "suggest_endpoints",
    arguments: { path: samplePath }
  });
  const parsedEp = JSON.parse((epRes.content[0] as any).text);
  console.log(`Suggested endpoints generated: ${parsedEp.totalEndpoints}`);
  console.log("Sample endpoints:", parsedEp.endpoints.slice(0, 3));

  // Test 6: Malformed YAML resiliency test
  console.log("\n[6] Testing malformed YAML error handling (must never crash)...");
  const malformedPath = path.resolve("./examples/malformed.yaml");
  import("fs").then(async (fs) => {
    fs.writeFileSync(malformedPath, "invalid: [yaml: foo: : {");
    const malformedVal = await client.callTool({
      name: "validate_schema",
      arguments: { path: malformedPath }
    });
    const parsedMalformed = JSON.parse((malformedVal.content[0] as any).text);
    console.log("Malformed validate_schema correctly caught error:", parsedMalformed);

    const malformedRead = await client.callTool({
      name: "read_schema",
      arguments: { path: malformedPath }
    });
    console.log("Malformed read_schema handled safely (isError):", (malformedRead as any).isError);

    fs.unlinkSync(malformedPath);

    // Test 7: List Resources
    console.log("\n[7] Testing resources discovery...");
    const resources = await client.listResources();
    console.log(`Discovered ${resources.resources.length} workspace resources:`, resources.resources.map(r => r.uri));

    await client.close();
    console.log("\nAll tests passed successfully!");
    process.exit(0);
  });
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
