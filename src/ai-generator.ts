import { GoogleGenAI } from "@google/genai";
import { Flobase } from "./schema.js";

/**
 * Optional AI layer that generates comprehensive API documentation in markdown (API_DOCS.md).
 * Requires GEMINI_API_KEY environment variable.
 * Deterministic generators (schema.sql, openapi.yaml, ER_DIAGRAM.md) NEVER depend on or overwrite this.
 */
export async function generateApiDocsWithAi(
  schema: Flobase,
  apiKey?: string
): Promise<string> {
  const resolvedKey = apiKey || process.env.GEMINI_API_KEY;
  if (!resolvedKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is missing. Set GEMINI_API_KEY to generate API_DOCS.md with --ai."
    );
  }

  const ai = new GoogleGenAI({ apiKey: resolvedKey });

  const prompt = `You are a Principal Software Architect. Given this unified application schema, generate production-ready API documentation in Markdown.

Schema Context:
Name: ${schema.name || "Flobase Application"}
Version: ${schema.version || "0.1.0"}
Description: ${schema.description || "N/A"}

Models & Fields:
${JSON.stringify(schema.models, null, 2)}

Endpoints:
${JSON.stringify(schema.endpoints || [], null, 2)}

Requirements for API_DOCS.md:
1. Executive Overview: Purpose and domain entities.
2. Authentication & Authorization expectations.
3. Data Models: Exhaustive tables of fields, PostgreSQL types, constraints, and relationships.
4. Endpoints Reference: Path, Method, Request payloads with JSON samples, status codes, and response bodies.
5. Error Handling: Standardized error responses (e.g. 400 Bad Request, 404 Not Found, 422 Unprocessable).

Produce clean Markdown only.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  });

  return (
    response.text ||
    `# API Documentation: ${schema.name || "Flobase"}\n\nGenerated with Gemini API.\n`
  );
}
