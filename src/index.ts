#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs/promises";
import * as path from "path";

import { handleReadSchema } from "./tools/read_schema.js";
import { handleGenerateErDiagram } from "./tools/generate_er_diagram.js";
import { handleValidateSchema } from "./tools/validate_schema.js";
import { handleSuggestEndpoints } from "./tools/suggest_endpoints.js";
import { findSchemaFiles } from "./workspace.js";

const SERVER_NAME = "flobase-mcp";
const SERVER_VERSION = "1.0.0";

export function createServer(): Server {
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION
    },
    {
      capabilities: {
        tools: {},
        resources: {}
      }
    }
  );

  // 1. Tool Listing
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "read_schema",
          description:
            "Read and parse a Flobase schema.yaml file, returning the validated schema as JSON along with a human-readable summary of models, fields, relationships, and endpoints.",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the schema.yaml or schema.yml file"
              }
            },
            required: ["path"]
          }
        },
        {
          name: "generate_er_diagram",
          description:
            "Generate a Mermaid.js Entity-Relationship (ER) diagram string deterministically from a Flobase file (uses local CLI if installed or inline deterministic engine).",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the schema.yaml or schema.yml file"
              }
            },
            required: ["path"]
          }
        },
        {
          name: "validate_schema",
          description:
            "Validate a Flobase YAML document using strict Zod definitions and relational integrity checks. Returns { valid: boolean, errors: string[] } and never throws.",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the schema.yaml or schema.yml file"
              }
            },
            required: ["path"]
          }
        },
        {
          name: "suggest_endpoints",
          description:
            "Suggest RESTful and GraphQL endpoints derived from schema models using fast, deterministic heuristics without any LLM calls (CRUD + nested relationship sub-resources).",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the schema.yaml or schema.yml file"
              }
            },
            required: ["path"]
          }
        }
      ]
    };
  });

  // 2. Tool Execution Handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;
    const args = (rawArgs || {}) as { path?: string };

    if (!args.path || typeof args.path !== "string") {
      return {
        content: [
          {
            type: "text",
            text: `Invalid arguments: 'path' string parameter is required.`
          }
        ],
        isError: true
      };
    }

    try {
      switch (name) {
        case "read_schema":
          return await handleReadSchema({ path: args.path });
        case "generate_er_diagram":
          return await handleGenerateErDiagram({ path: args.path });
        case "validate_schema":
          return await handleValidateSchema({ path: args.path });
        case "suggest_endpoints":
          return await handleSuggestEndpoints({ path: args.path });
        default:
          return {
            content: [
              {
                type: "text",
                text: `Unknown tool '${name}' requested.`
              }
            ],
            isError: true
          };
      }
    } catch (err: any) {
      // Catch-all safety guard to ensure server never crashes
      return {
        content: [
          {
            type: "text",
            text: `Unhandled exception during tool '${name}' execution: ${err?.message || String(err)}`
          }
        ],
        isError: true
      };
    }
  });

  // 3. Workspace Resources: discover schema files and expose flobase://{path}
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const workspaceRoot = process.cwd();
    const files = await findSchemaFiles(workspaceRoot);

    const resources = files.map((filePath) => {
      const relPath = path.relative(workspaceRoot, filePath);
      return {
        uri: `flobase://${filePath}`,
        name: `Flobase: ${relPath}`,
        description: `Unified schema file at ${relPath}`,
        mimeType: "application/yaml"
      };
    });

    return { resources };
  });

  // 4. Read Resource Handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const prefix = "flobase://";

    if (!uri.startsWith(prefix)) {
      throw new Error(`Unsupported URI format '${uri}'. Expected '${prefix}{path}'`);
    }

    const filePath = uri.slice(prefix.length);
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return {
        contents: [
          {
            uri,
            mimeType: "application/yaml",
            text: content
          }
        ]
      };
    } catch (err: any) {
      throw new Error(`Could not read resource at '${filePath}': ${err?.message || String(err)}`);
    }
  });

  return server;
}

// Bootstrap STDIO server
async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();

  // Handle process shutdown cleanly
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await server.close();
    process.exit(0);
  });

  await server.connect(transport);
}

// Only auto-run if executed directly as entrypoint
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    // Write errors to stderr so STDIO JSON-RPC on stdout is never corrupted
    process.stderr.write(`Fatal error starting Flobase MCP server: ${err?.message || String(err)}\n`);
    process.exit(1);
  });
}
