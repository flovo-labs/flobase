# Flobase Roadmap

Flobase is engineered with strict scope discipline. Each minor version expands target ecosystems while preserving 100% deterministic generation guarantees.

---

## v0.1 (Current Release)

- **Database Target**: PostgreSQL only.
  - Automatic type mappings (`uuid`, `string`, `int`, `decimal`, `bool`, `timestamp`, `date`, `json`, `enum`).
  - Topological foreign key ordering.
  - Inline check constraints, primary keys, and unique indexes.
- **API Target**: REST with OpenAPI 3.1 contract.
  - Request and response body generation from models.
  - CRUD path parameters and response code derivations.
- **Diagrams**: Mermaid.js ER diagram (`erDiagram`) output.
- **MCP Server**: Stdio transport with tools (`read_schema`, `validate_schema`, `generate_er_diagram`, `suggest_endpoints`) and workspace schema discovery.
- **AI Extension**: Optional `API_DOCS.md` generation with `--ai` via Gemini API (never touches deterministic files).

---

## v0.2 (Next Milestone)

- **MongoDB / Document Store Target**:
  - JSON Schema collection validators for MongoDB.
  - Mongoose and Prisma document schema definitions.
- **GraphQL Target**:
  - Full GraphQL SDL schema generator (`type Query`, `type Mutation`, input types).
  - Relationship field resolvers interface generation.
- **gRPC / Protocol Buffers Target**:
  - Deterministic `.proto` (proto3) definition generation from models and endpoints.
- **Enhanced MCP Capabilities**:
  - Two-way schema diffing and refactoring suggestions via MCP tools.
  - Reverse engineering: connect to a live Postgres DB and emit a `schema.yaml`.

---

## Later / Exploring

- MySQL, SQLite, and CockroachDB generator targets.
- TypeScript client SDK generation from generated OpenAPI specifications.
- Terraform / Pulumi database migration provider orchestration.
- Live watch mode: `flobase watch schema.yaml` with hot recompilation.
