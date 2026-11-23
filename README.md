# Flobase

A unified schema-driven DSL. Define your data model once in YAML and generate PostgreSQL DDL, OpenAPI 3.1 contracts, and ER diagrams.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-full.svg">
    <img src="assets/logo-full.svg" alt="Flobase Logo" width="240" />
  </picture>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/flobase"><img src="https://img.shields.io/npm/v/flobase.svg?color=b8f34a&labelColor=10120f" alt="npm version" /></a>
  <a href="https://github.com/flovo-labs/flobase/actions"><img src="https://img.shields.io/github/actions/workflow/status/flovo-labs/flobase/ci.yml?branch=main&labelColor=10120f" alt="Build Status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-b8f34a.svg?labelColor=10120f" alt="License: MIT" /></a>
</p>

---

## Architecture

Flobase is structured as a monorepo containing three core packages:

| Package | Role | Description |
| :--- | :--- | :--- |
| **`flobase`** | CLI & Compiler | The core compilation engine. Reads `schema.yaml` and deterministically outputs PostgreSQL DDL, OpenAPI 3.1 contracts, and Mermaid ER diagrams. |
| **`flobase-mcp`** | AI Integration | A Model Context Protocol (MCP) server providing deterministic tools (`read_schema`, `validate_schema`, `generate_sql`, `generate_er_diagram`) to AI assistants like Cursor, Claude, and Windsurf. |
| **`flobase-editor`** | Visual UI | A local browser-based visual schema canvas built on React Flow that maintains bidirectional sync with `schema.yaml` while preserving comments. |

---

## Installation & Usage

### 1. Initialize a Project

Scaffold a starter schema and IDE autocomplete configuration:

```bash
npx flobase init
```

Or install globally:

```bash
npm install -g flobase
flobase init
```

### 2. Define the Schema (`schema.yaml`)

```yaml
version: "0.1.0"
name: "TaskManagementSystem"
description: "Core schema for users and task assignments"

models:
  User:
    tableName: "users"
    fields:
      id:
        type: uuid
        primary: true
      email:
        type: string
        unique: true
        required: true
      name:
        type: string
        required: true

  Task:
    tableName: "tasks"
    fields:
      id:
        type: uuid
        primary: true
      userId:
        type: uuid
        references: "User.id"
      title:
        type: string
        required: true
      status:
        type: string
        default: "todo"

endpoints:
  - method: GET
    path: /api/tasks
    summary: "Retrieve task items"
    model: Task

  - method: POST
    path: /api/tasks
    summary: "Create a task"
    model: Task
```

### 3. Compile Schema Target

```bash
npx flobase build schema.yaml
```

CLI Output:
```text
Success: Generated ER diagram -> output/ER_DIAGRAM.md
Success: Generated PostgreSQL DDL -> output/schema.sql
Success: Generated OpenAPI 3.1 -> output/openapi.yaml
```

To view stdout without modifying disk:
```bash
npx flobase build schema.yaml --dry-run
```

To launch the visual canvas editor:
```bash
npx flobase editor schema.yaml
```

---

## Model Context Protocol (MCP) Configuration

Configure your AI assistant to read, validate, and generate SQL directly from your schema files.

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

Exposed MCP Tools:
- `read_schema`: Parse and summarize models, fields, and endpoints.
- `validate_schema`: Validate syntax and foreign key integrity.
- `generate_sql`: Emit PostgreSQL DDL deterministically.
- `generate_er_diagram`: Emit Mermaid ER diagram markdown.

---

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for local development setup, coding standards, and pull request guidelines.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
