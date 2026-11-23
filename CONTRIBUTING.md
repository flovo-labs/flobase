# Contributing to Flobase

Thank you for your interest in contributing to Flobase. We build deterministic developer tools designed to be the single source of truth for database schemas and API contracts.

---

## 1. Scope Discipline

Flobase v0.1 is intentionally focused on **PostgreSQL + REST (OpenAPI 3.1)**. 

Before opening an issue or PR proposing new targets (GraphQL, MongoDB, MySQL, gRPC):
- Review `ROADMAP.md` for target release milestones.
- Ensure new generators are **100% deterministic** (no external AI dependency for core code generation).
- All generated outputs must be verified with formal validator test fixtures (e.g., `@apidevtools/swagger-parser` or SQL parsers).

---

## 2. Design Principles & Brand Tokens

Flobase adheres strictly to the **Flobase Design System**. Please consult [DESIGN.md](DESIGN.md) before contributing to:
- The visual canvas editor (`packages/editor`)
- Terminal CLI formatting and color schemes (`packages/cli`)
- SVG assets, graphics, and documentation

### Visual Rules:
- **Palette**: Dark mode primary. Background `#10120f`, surface cards `#151814` and `#1c221b`, borders `#262f25`, primary accent `#b8f34a` (Brand Lime).
- **Typography**: `Manrope` for display/UI sans, `DM Mono` for schema types, foreign keys, and code blocks.
- **Elevation**: Use organic deep ambient shadows over harsh borders (`0 4px 16px rgba(0, 0, 0, 0.25)`).
- **CLI Cleanliness**: Keep terminal logs minimal. Use plain text formatting (`Success:`, `[WARN]`, `[ERROR]`) with clean gray and green accents. No emojis.

---

## 3. Development Workflow

### Requirements
- Node.js >= 20.0.0
- npm >= 10.0.0

### Setup
```bash
git clone https://github.com/flobase/flobase.git
cd flobase
npm install
npm run build
```

### Running Tests & Verification
```bash
# Run unit tests across workspaces
npm test

# Check code formatting & types
npm run build
```

---

## 4. Pull Request Guidelines

1. **Keep it focused**: One bugfix or feature per PR.
2. **Deterministic first**: Core generators must never call external cloud LLMs.
3. **No regressions**: Tests must pass with zero warnings.
4. **Code style**: Use Prettier and ESLint conventions provided in the repo.

---

## 5. Code of Conduct

We are committed to providing a welcoming, constructive, and harassment-free experience for everyone. Be respectful, direct, and kind in reviews and issue discussions.
