import { Node, Edge } from "reactflow";

export interface FieldItem {
  name: string;
  type: string;
  primaryKey?: boolean;
  unique?: boolean;
  required?: boolean;
  nullable?: boolean;
  default?: any;
  references?: string;
}

export interface ModelNodeData {
  modelName: string;
  tableName?: string;
  fields: Record<string, FieldItem>;
  onAddField?: (modelName: string) => void;
  onDeleteField?: (modelName: string, fieldName: string) => void;
  onRenameModel?: (oldName: string, newName: string) => void;
}

export interface RelationEdgeData {
  sourceField: string;
  targetModel: string;
  type?: string;
  onUpdateSourceField?: (edgeId: string, newField: string) => void;
}

/**
 * Converts a Flobase JSON document into React Flow Nodes and Edges
 */
export function schemaToReactFlow(schema: any): {
  nodes: Node<ModelNodeData>[];
  edges: Edge<RelationEdgeData>[];
} {
  const nodes: Node<ModelNodeData>[] = [];
  const edges: Edge<RelationEdgeData>[] = [];
  const models = schema?.models || {};

  const modelKeys = Object.keys(models);
  const cols = Math.ceil(Math.sqrt(modelKeys.length || 1));
  const spacingX = 340;
  const spacingY = 280;

  modelKeys.forEach((modelName, index) => {
    const model = models[modelName];
    const x = (index % cols) * spacingX + 50;
    const y = Math.floor(index / cols) * spacingY + 50;

    const fieldsMap: Record<string, FieldItem> = {};
    for (const [fName, fDef] of Object.entries(model.fields || {})) {
      const def = (fDef as any) || {};
      fieldsMap[fName] = {
        name: fName,
        type: def.type || "string",
        primaryKey: def.primaryKey || def.primary,
        unique: def.unique,
        required: def.required,
        nullable: def.nullable,
        default: def.default,
        references: def.references
      };
    }

    nodes.push({
      id: modelName,
      type: "modelNode",
      position: { x, y },
      data: {
        modelName,
        tableName: model.tableName,
        fields: fieldsMap
      }
    });

    // Extract explicit relationships to edges
    if (model.relationships) {
      for (const [relName, rel] of Object.entries<any>(model.relationships)) {
        if (rel.model && models[rel.model]) {
          const edgeId = `edge-${modelName}-${rel.model}-${relName}`;
          edges.push({
            id: edgeId,
            source: modelName,
            target: rel.model,
            type: "relationEdge",
            data: {
              sourceField: rel.foreignKey || relName,
              targetModel: rel.model,
              type: rel.type || "one-to-many"
            }
          });
        }
      }
    }

    // Extract implicit FK references (e.g. references: User.id)
    if (model.fields) {
      for (const [fieldName, fDef] of Object.entries<any>(model.fields)) {
        if (fDef.references) {
          const [targetModel] = fDef.references.split(".");
          if (targetModel && models[targetModel]) {
            const edgeId = `edge-fk-${modelName}-${targetModel}-${fieldName}`;
            // Avoid duplicate edge if already registered
            if (!edges.some((e) => e.id === edgeId)) {
              edges.push({
                id: edgeId,
                source: modelName,
                target: targetModel,
                type: "relationEdge",
                data: {
                  sourceField: fieldName,
                  targetModel,
                  type: "many-to-one"
                }
              });
            }
          }
        }
      }
    }
  });

  return { nodes, edges };
}

/**
 * Serializes React Flow Nodes and Edges back into the exact schema shape expected by Flobase
 */
export function reactFlowToSchema(
  nodes: Node<ModelNodeData>[],
  edges: Edge<RelationEdgeData>[],
  baseSchema?: any
): any {
  const models: Record<string, any> = {};

  for (const node of nodes) {
    const { modelName, tableName, fields } = node.data;
    const baseModel = baseSchema?.models?.[modelName] || {};

    const cleanFields: Record<string, any> = {};
    for (const [fName, fItem] of Object.entries(fields)) {
      cleanFields[fName] = {
        type: fItem.type || "string"
      };
      if (fItem.primaryKey) cleanFields[fName].primary = true;
      if (fItem.unique) cleanFields[fName].unique = true;
      if (fItem.required) cleanFields[fName].required = true;
      if (fItem.nullable) cleanFields[fName].nullable = true;
      if (fItem.default !== undefined) cleanFields[fName].default = fItem.default;
      if (fItem.references) cleanFields[fName].references = fItem.references;
    }

    models[modelName] = {
      ...baseModel,
      tableName: tableName || undefined,
      fields: cleanFields,
      relationships: {}
    };
  }

  // Map edges to relationships and foreign key references
  for (const edge of edges) {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (sourceNode && targetNode && models[edge.source]) {
      const sourceField = edge.data?.sourceField || `${edge.target.toLowerCase()}Id`;
      const relName = edge.data?.sourceField || edge.target.toLowerCase();

      // Ensure the source model has the FK field
      if (models[edge.source].fields[sourceField]) {
        models[edge.source].fields[sourceField].references = `${edge.target}.id`;
      }

      models[edge.source].relationships[relName] = {
        type: edge.data?.type || "many-to-one",
        model: edge.target,
        foreignKey: sourceField
      };
    }
  }

  // Clean empty relationships
  for (const model of Object.values(models)) {
    if (model.relationships && Object.keys(model.relationships).length === 0) {
      delete model.relationships;
    }
  }

  return {
    version: baseSchema?.version || "0.1.0",
    name: baseSchema?.name || "AppSchema",
    description: baseSchema?.description,
    models,
    endpoints: baseSchema?.endpoints
  };
}
