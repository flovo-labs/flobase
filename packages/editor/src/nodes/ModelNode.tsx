import React, { useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ModelNodeData } from "../lib/serialize.js";

export const ModelNode: React.FC<NodeProps<ModelNodeData>> = ({ id, data, selected }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(data.modelName);

  const handleNameSubmit = () => {
    setIsEditingName(false);
    if (nameInput.trim() && nameInput !== data.modelName) {
      data.onRenameModel?.(data.modelName, nameInput.trim());
    }
  };

  const fieldsList = Object.entries(data.fields || {});

  return (
    <div
      style={{
        background: "var(--surface)",
        border: selected ? "1px solid var(--lime)" : "1px solid var(--line)",
        borderRadius: "14px",
        minWidth: "250px",
        boxShadow: selected
          ? "0 0 0 1px var(--lime), 0 12px 32px rgba(184, 243, 74, 0.12)"
          : "0 4px 16px rgba(0, 0, 0, 0.25)",
        color: "var(--text)",
        fontSize: "12px",
        userSelect: "none",
        fontFamily: "var(--font-sans)",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        overflow: "hidden"
      }}
    >
      {/* Target Handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: "var(--lime)",
          border: "2px solid var(--surface)",
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          left: "-6px"
        }}
      />

      {/* Node Header */}
      <div
        style={{
          padding: "10px 14px",
          background: "var(--surface-2)",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        {isEditingName ? (
          <input
            type="text"
            value={nameInput}
            autoFocus
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNameSubmit();
              if (e.key === "Escape") setIsEditingName(false);
            }}
            style={{
              background: "var(--surface-3)",
              color: "var(--text)",
              border: "1px solid var(--lime)",
              borderRadius: "6px",
              padding: "3px 8px",
              fontSize: "12px",
              fontWeight: 700,
              width: "130px",
              outline: "none",
              fontFamily: "var(--font-sans)"
            }}
          />
        ) : (
          <div
            onDoubleClick={() => setIsEditingName(true)}
            title="Double click to rename model"
            style={{
              fontWeight: 800,
              color: "var(--lime)",
              cursor: "pointer",
              fontSize: "13px",
              letterSpacing: "-0.2px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--lime)",
                display: "inline-block"
              }}
            />
            {data.modelName}
          </div>
        )}

        <button
          onClick={() => data.onAddField?.(data.modelName)}
          title="Add Field"
          style={{
            background: "var(--surface-3)",
            border: "1px solid var(--line)",
            color: "var(--text)",
            borderRadius: "6px",
            cursor: "pointer",
            width: "22px",
            height: "22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            lineHeight: 1,
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--lime)";
            e.currentTarget.style.color = "var(--lime)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--line)";
            e.currentTarget.style.color = "var(--text)";
          }}
        >
          +
        </button>
      </div>

      {/* Field List */}
      <div style={{ padding: "6px 0" }}>
        {fieldsList.length === 0 ? (
          <div style={{ padding: "8px 14px", color: "var(--muted)", fontStyle: "italic" }}>No fields</div>
        ) : (
          fieldsList.map(([fName, field]) => (
            <div
              key={fName}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "5px 14px",
                position: "relative",
                transition: "background 0.15s ease"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontWeight: 500, color: "var(--text)" }}>
                  {fName}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-2)",
                    fontSize: "11px"
                  }}
                >
                  {field.type}
                </span>
                {field.primaryKey && (
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      background: "var(--lime)",
                      color: "var(--lime-ink)",
                      padding: "1px 5px",
                      borderRadius: "4px"
                    }}
                  >
                    PK
                  </span>
                )}
                {field.unique && !field.primaryKey && (
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      background: "var(--surface-3)",
                      color: "var(--lime)",
                      border: "1px solid var(--line-highlight)",
                      padding: "1px 5px",
                      borderRadius: "4px"
                    }}
                  >
                    UQ
                  </span>
                )}
                {field.references && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-2)",
                      display: "flex",
                      alignItems: "center",
                      gap: "2px"
                    }}
                  >
                    → {field.references}
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  data.onDeleteField?.(data.modelName, fName);
                }}
                title="Delete Field"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  fontSize: "12px",
                  padding: "0 4px",
                  lineHeight: 1
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      {/* Source Handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: "var(--lime)",
          border: "2px solid var(--surface)",
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          right: "-6px"
        }}
      />
    </div>
  );
};
