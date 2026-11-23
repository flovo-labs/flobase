export interface SchemaResponse {
  success: boolean;
  path?: string;
  schema?: any;
  error?: string;
  errors?: string[];
  sequence?: number;
}

export interface ValidateResponse {
  valid: boolean;
  errors: string[];
}

export interface OpenApiResponse {
  openapi: string;
  errors: string[];
}

export async function fetchSchema(): Promise<SchemaResponse> {
  const res = await fetch("/api/schema");
  return res.json();
}

export async function saveSchema(schema: any, sequence?: number): Promise<SchemaResponse> {
  const res = await fetch("/api/schema", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schema, sequence })
  });
  return res.json();
}

export async function validateSchema(schema: any): Promise<ValidateResponse> {
  const res = await fetch("/api/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schema })
  });
  return res.json();
}

export async function fetchOpenApi(schema: any): Promise<OpenApiResponse> {
  const res = await fetch("/api/openapi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schema })
  });
  return res.json();
}
