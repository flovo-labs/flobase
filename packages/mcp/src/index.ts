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

import { handleReadSchema } from "./tools/read-schema.js";
import { handleValidateSchema } from "./tools/validate-schema.js";
import { handleGenerateErDiagram } from "./tools/generate-er-diagram.js";
import { handleGenerateSql } from "./tools/generate-sql.js";
import { findSchemaFiles } from "./resources/schema-resource.js";

const SERVER_NAME = "flobase-mcp";
const SERVER_VERSION = "0.1.0";

export function createMcpServer(): Server {
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
          name: "validate_schema",
          description:
            "Validate a Flobase YAML document using strict Zod definitions and relational integrity checks. Returns { valid: boolean, errors: [{ path: string, message: string }] } and never throws.",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the schema.yaml file"
              }
            },
            required: ["path"]
          }
        },
        {
          name: "generate_er_diagram",
          description:
            "Generate a Mermaid.js Entity-Relationship (ER) diagram string deterministically from a Flobase schema file.",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the schema.yaml file"
              }
            },
            required: ["path"]
          }
        },
        {
          name: "generate_sql",
          description:
            "Generate PostgreSQL DDL deterministically from a Flobase schema file.",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to the schema.yaml file"
              },
              dialect: {
                type: "string",
                enum: ["postgres"],
                description: "SQL dialect (defaults to postgres)"
              }
            },
            required: ["path"]
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const toolArgs = (args || {}) as Record<string, any>;

    switch (name) {
      case "read_schema": {
        const res = await handleReadSchema({ path: toolArgs.path });
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
        };
      }
      case "validate_schema": {
        const res = await handleValidateSchema({ path: toolArgs.path });
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
        };
      }
      case "generate_er_diagram": {
        const res = await handleGenerateErDiagram({ path: toolArgs.path });
        return {
          content: [{ type: "text", text: res.mermaid }]
        };
      }
      case "generate_sql": {
        const res = await handleGenerateSql({
          path: toolArgs.path,
          dialect: toolArgs.dialect || "postgres"
        });
        return {
          content: [{ type: "text", text: res.sql }]
        };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const cwd = process.cwd();
    const files = await findSchemaFiles(cwd);
    return {
      resources: files.map((filePath) => {
        const relPath = path.relative(cwd, filePath);
        return {
          uri: `flobase://${relPath}`,
          name: `Flobase Schema: ${relPath}`,
          mimeType: "application/x-yaml",
          description: `Flobase schema file located at ${relPath}`
        };
      })
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const prefix = "flobase://";
    if (!uri.startsWith(prefix)) {
      throw new Error(`Invalid resource URI: ${uri}`);
    }
    const relPath = uri.slice(prefix.length);
    const fullPath = path.resolve(process.cwd(), relPath);
    const content = await fs.readFile(fullPath, "utf-8");
    return {
      contents: [
        {
          uri,
          mimeType: "application/x-yaml",
          text: content
        }
      ]
    };
  });

  return server;
}

async function main() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();

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

const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("dist/index.js") || process.argv[1].endsWith("src/index.ts"));

if (isDirectRun) {
  main().catch((err) => {
    process.stderr.write(`Fatal error starting Flobase MCP server: ${err?.message || String(err)}\n`);
    process.exit(1);
  });
}
