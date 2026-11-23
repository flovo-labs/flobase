import React from "react";
import { Node, Edge } from "reactflow";
import { ModelNodeData, RelationEdgeData, FieldItem } from "../lib/serialize.js";

const SUPPORTED_TYPES = [
  "string",
  "text",
  "int",
  "integer",
  "float",
  "decimal",
  "bool",
  "boolean",
  "datetime",
  "timestamp",
  "date",
  "time",
  "uuid",
  "json",
  "enum"
];

interface SidePanelProps {
  selectedNode: Node<ModelNodeData> | null;
  selectedEdge: Edge<RelationEdgeData> | null;
  nodes: Node<ModelNodeData>[];
  onUpdateNodeData: (nodeId: string, updatedData: Partial<ModelNodeData>) => void;
  onUpdateEdgeData: (edgeId: string, updatedData: Partial<RelationEdgeData>) => void;
  onClose: () => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  selectedNode,
  selectedEdge,
  nodes,
  onUpdateNodeData,
  onUpdateEdgeData,
  onClose
}) => {
  if (!selectedNode && !selectedEdge) {
    return null;
  }

  return (
    <div
      style={{
        width: "330px",
        background: "var(--surface)",
        borderLeft: "1px solid var(--line)",
        padding: "20px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        fontSize: "13px",
        fontFamily: "var(--font-sans)",
        boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.3)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3
          style={{
            margin: 0,
            color: "var(--text)",
            fontSize: "14px",
            fontWeight: 800,
            letterSpacing: "-0.2px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--lime)"
            }}
          />
          {selectedNode ? "Model Properties" : "Relation Properties"}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            color: "var(--text-2)",
            borderRadius: "6px",
            cursor: "pointer",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-2)")}
        >
          Close
        </button>
      </div>

      {/* Node Editing Mode */}
      {selectedNode && (
        <>
          <div>
            <label style={{ display: "block", color: "var(--text-2)", fontSize: "11px", fontWeight: 600, marginBottom: "6px" }}>
              MODEL NAME
            </label>
            <input
              type="text"
              value={selectedNode.data.modelName}
              onChange={(e) =>
                onUpdateNodeData(selectedNode.id, {
                  modelName: e.target.value
                })
              }
              style={{
                width: "100%",
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                padding: "8px 10px",
                color: "var(--text)",
                boxSizing: "border-box",
                outline: "none",
                fontFamily: "var(--font-sans)",
                fontSize: "13px"
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--lime)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
            />
          </div>

          <div>
            <label style={{ display: "block", color: "var(--text-2)", fontSize: "11px", fontWeight: 600, marginBottom: "6px" }}>
              TABLE NAME (OPTIONAL)
            </label>
            <input
              type="text"
              value={selectedNode.data.tableName || ""}
              placeholder={selectedNode.data.modelName.toLowerCase() + "s"}
              onChange={(e) =>
                onUpdateNodeData(selectedNode.id, {
                  tableName: e.target.value || undefined
                })
              }
              style={{
                width: "100%",
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                padding: "8px 10px",
                color: "var(--text)",
                boxSizing: "border-box",
                outline: "none",
                fontFamily: "var(--font-mono)",
                fontSize: "12px"
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--lime)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
            />
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px"
              }}
            >
              <label style={{ color: "var(--text-2)", fontSize: "11px", fontWeight: 600 }}>FIELDS</label>
              <button
                onClick={() => selectedNode.data.onAddField?.(selectedNode.data.modelName)}
                style={{
                  background: "var(--lime)",
                  color: "var(--lime-ink)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.15s ease"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--lime-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--lime)")}
              >
                + Add Field
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.entries(selectedNode.data.fields).map(([fieldName, field]) => (
                <div
                  key={fieldName}
                  style={{
                    background: "var(--surface-2)",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)"
                  }}
                >
                  <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        const newFields = { ...selectedNode.data.fields };
                        delete newFields[fieldName];
                        newFields[newName] = { ...field, name: newName };
                        onUpdateNodeData(selectedNode.id, { fields: newFields });
                      }}
                      style={{
                        flex: 1,
                        background: "var(--surface-3)",
                        border: "1px solid var(--line)",
                        borderRadius: "6px",
                        padding: "5px 8px",
                        color: "var(--text)",
                        fontSize: "12px",
                        outline: "none"
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--lime)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                    />

                    <select
                      value={field.type}
                      onChange={(e) => {
                        const newFields = { ...selectedNode.data.fields };
                        newFields[fieldName] = { ...field, type: e.target.value };
                        onUpdateNodeData(selectedNode.id, { fields: newFields });
                      }}
                      style={{
                        background: "var(--surface-3)",
                        border: "1px solid var(--line)",
                        borderRadius: "6px",
                        padding: "5px 8px",
                        color: "var(--lime)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        outline: "none"
                      }}
                    >
                      {SUPPORTED_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "var(--text-2)" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={!!field.primaryKey}
                        onChange={(e) => {
                          const newFields = { ...selectedNode.data.fields };
                          newFields[fieldName] = { ...field, primaryKey: e.target.checked };
                          onUpdateNodeData(selectedNode.id, { fields: newFields });
                        }}
                        style={{ accentColor: "var(--lime)" }}
                      />
                      Primary
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={!!field.unique}
                        onChange={(e) => {
                          const newFields = { ...selectedNode.data.fields };
                          newFields[fieldName] = { ...field, unique: e.target.checked };
                          onUpdateNodeData(selectedNode.id, { fields: newFields });
                        }}
                        style={{ accentColor: "var(--lime)" }}
                      />
                      Unique
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={!!field.required}
                        onChange={(e) => {
                          const newFields = { ...selectedNode.data.fields };
                          newFields[fieldName] = { ...field, required: e.target.checked };
                          onUpdateNodeData(selectedNode.id, { fields: newFields });
                        }}
                        style={{ accentColor: "var(--lime)" }}
                      />
                      Required
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Edge Editing Mode */}
      {selectedEdge && (
        <>
          <div>
            <label style={{ display: "block", color: "var(--text-2)", fontSize: "11px", fontWeight: 600, marginBottom: "6px" }}>
              FOREIGN KEY FIELD
            </label>
            <input
              type="text"
              value={selectedEdge.data?.sourceField || ""}
              onChange={(e) => {
                const newField = e.target.value;
                onUpdateEdgeData(selectedEdge.id, { sourceField: newField });
                selectedEdge.data?.onUpdateSourceField?.(selectedEdge.id, newField);
              }}
              style={{
                width: "100%",
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                padding: "8px 10px",
                color: "var(--text)",
                boxSizing: "border-box",
                outline: "none",
                fontFamily: "var(--font-mono)",
                fontSize: "12px"
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--lime)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
            />
          </div>

          <div>
            <label style={{ display: "block", color: "var(--text-2)", fontSize: "11px", fontWeight: 600, marginBottom: "6px" }}>
              TARGET MODEL
            </label>
            <select
              value={selectedEdge.target}
              disabled
              style={{
                width: "100%",
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                padding: "8px 10px",
                color: "var(--muted)",
                boxSizing: "border-box",
                cursor: "not-allowed",
                fontFamily: "var(--font-sans)"
              }}
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.data.modelName}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
};
