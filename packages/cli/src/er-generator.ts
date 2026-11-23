import { Flobase } from "./schema.js";

/**
 * Deterministic inline ER diagram generation following Mermaid erDiagram syntax.
 */
export function generateMermaidEr(schema: Flobase): string {
  const lines: string[] = ["erDiagram"];
  const models = schema.models || {};
  const relationsDrawn = new Set<string>();

  // 1. Define entities and their attributes
  for (const [modelName, model] of Object.entries(models)) {
    lines.push(`    ${modelName} {`);
    for (const [fieldName, field] of Object.entries(model.fields || {})) {
      const sanitizedType = (field.type || "string").replace(/[^a-zA-Z0-9_]/g, "_");
      const pkOrFk = (field.primaryKey || field.primary) ? "PK" : field.references ? "FK" : "";
      const comment = field.description ? ` "${field.description.replace(/"/g, "'")}"` : "";
      lines.push(`        ${sanitizedType} ${fieldName}${pkOrFk ? ` ${pkOrFk}` : ""}${comment}`);
    }
    lines.push(`    }`);
  }

  lines.push("");

  // 2. Render relationships from explicit relationship declarations
  for (const [sourceModel, model] of Object.entries(models)) {
    if (!model.relationships) continue;
    for (const [relName, rel] of Object.entries(model.relationships)) {
      const targetModel = rel.model;
      if (!targetModel) continue;

      const relationKey = [sourceModel, targetModel, relName].sort().join("::");
      if (relationsDrawn.has(relationKey)) continue;
      relationsDrawn.add(relationKey);

      let arrow = "||--o{";
      switch (rel.type) {
        case "one-to-one":
          arrow = "||--||";
          break;
        case "one-to-many":
          arrow = "||--o{";
          break;
        case "many-to-one":
          arrow = "}o--||";
          break;
        case "many-to-many":
          arrow = "}o--o{";
          break;
      }

      const label = relName || "relates";
      lines.push(`    ${sourceModel} ${arrow} ${targetModel} : "${label}"`);
    }
  }

  // 3. Render inferred relationships from field references
  for (const [sourceModel, model] of Object.entries(models)) {
    for (const [fieldName, field] of Object.entries(model.fields || {})) {
      if (field.references) {
        const parts = field.references.split(".");
        const targetModel = parts[0];
        if (targetModel && models[targetModel]) {
          const relationKey = [sourceModel, targetModel, fieldName].sort().join("::");
          if (!relationsDrawn.has(relationKey)) {
            relationsDrawn.add(relationKey);
            lines.push(`    ${targetModel} ||--o{ ${sourceModel} : "${fieldName}"`);
          }
        }
      }
    }
  }

  return lines.join("\n") + "\n";
}
