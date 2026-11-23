# Manual Smoke Test Guide (Flobase v0.1.0)

Follow this step-by-step checklist to test the package end-to-end before publishing:

### 1. Build and Test Suite
```bash
npm install
npm run build
npm test
```
- Verify: 10 test files pass with 28 tests passing and zero failures.

### 2. Scaffold a Starter Schema
In a temporary directory:
```bash
node /path/to/flobase/dist/bin.js init
```
- Verify: `schema.yaml` and `.vscode/settings.json` are created.

### 3. Build Artifacts
```bash
node /path/to/flobase/dist/bin.js build schema.yaml
```
- Verify directory `output/` is created with:
  - `ER_DIAGRAM.md`
  - `schema.sql`
  - `openapi.yaml`

### 4. Inspect Outputs
1. **Mermaid ER Diagram**: Open `output/ER_DIAGRAM.md` in any Mermaid viewer or GitHub preview and confirm diagram renders.
2. **PostgreSQL DDL**: Run `psql -f output/schema.sql` against a local test Postgres database and verify all tables create cleanly without syntax errors.
3. **OpenAPI 3.1**: Paste `output/openapi.yaml` into Swagger Editor or Swagger UI and verify zero validation errors.
