# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-03-30

### Added
- Core Flobase engine validating unified schemas via Zod and relational reference integrity.
- Deterministic PostgreSQL DDL code generator (`CREATE TABLE`, primary keys, foreign keys, constraints, indexes).
- Deterministic OpenAPI 3.1 REST specification generator with request and response schemas.
- Deterministic Mermaid.js Entity-Relationship (ER) diagram generator (`erDiagram`).
- Optional `--ai` capability for generating `API_DOCS.md` through Google Gemini API.
- CLI scaffolding with `flobase init` configuring schema files and VS Code autocompletion.
- `flobase build` supporting `--dry-run` and clean output directories.
- Full MCP (Model Context Protocol) server over stdio for Cursor, Claude Code, and Windsurf integration.
- Comprehensive Vitest test suite with OpenAPI and PostgreSQL syntax validation.
