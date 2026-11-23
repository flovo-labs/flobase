# flobase-editor

Browser-based visual canvas editor for Flobase schemas built on React Flow and Express.

## Features

- **Round-Trip Fidelity**: Serializes to YAML preserving non-structural comments and formatting.
- **Real-Time OpenAPI Preview**: Live compilation of OpenAPI 3.1 contracts with syntax validation.
- **Design Tokens**: Clean, high-contrast dark theme with accessible typographic hierarchy.

## Usage

```bash
# Launch editor on schema.yaml
npx flobase editor schema.yaml
```

The editor starts a backend sync server on port 3001 and opens the canvas interface at `http://localhost:5173`.

## Architecture
- Frontend: React 18, React Flow, Vite.
- Backend: Express, YAML `parseDocument` with `setIn()` mutation.

## License
MIT
