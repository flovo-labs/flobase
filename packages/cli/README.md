# flobase

Command line interface and core deterministic compilation engine for Flobase.

## Installation

```bash
# Run directly via npx
npx flobase --help

# Or install globally
npm install -g flobase
```

## CLI Usage

### Initialize Starter Schema
```bash
flobase init
```
Generates `schema.yaml` and sets up IDE schema autocompletion in `.vscode/settings.json`.

### Build Compilation Target
```bash
flobase build schema.yaml
```
Compiles:
- `output/schema.sql` (PostgreSQL DDL)
- `output/openapi.yaml` (OpenAPI 3.1)
- `output/ER_DIAGRAM.md` (Mermaid ER diagram)

### Flags
- `--dry-run`: Emits generated outputs to stdout without writing files to disk.
- `--ai`: Generates extended API reference documentation using Google Gemini API (`GEMINI_API_KEY` required).

## Library Exports
```typescript
import { parseAndValidateSchema } from "flobase/schema";
import { generatePostgresDDL } from "flobase/pg-generator";
import { generateOpenApiYaml } from "flobase/openapi-generator";
import { generateMermaidEr } from "flobase/er-generator";
```

## License
MIT
