# flobase-mcp

Model Context Protocol (MCP) server for Flobase. Connects schema architecture directly to AI assistants including Cursor, Claude Desktop, and Windsurf.

## Configuration

### Cursor (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "flobase": {
      "command": "npx",
      "args": ["-y", "flobase-mcp"]
    }
  }
}
```

### Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "flobase": {
      "command": "npx",
      "args": ["-y", "flobase-mcp"]
    }
  }
}
```

## Protocol Tools

- **`read_schema`**: Returns parsed schema JSON and an architectural summary.
- **`validate_schema`**: Checks syntax and foreign key integrity. Never throws unhandled errors.
- **`generate_er_diagram`**: Produces Mermaid ER diagram syntax deterministically.
- **`generate_sql`**: Produces PostgreSQL DDL deterministically.

## Resources
Exposes schema files under `flobase://{path}` for workspace context inclusion.

## License
MIT
