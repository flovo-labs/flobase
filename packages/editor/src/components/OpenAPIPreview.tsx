import React, { useState } from "react";

interface OpenAPIPreviewProps {
  openapiYaml: string;
  isStale: boolean;
  errors: string[];
}

export const OpenAPIPreview: React.FC<OpenAPIPreviewProps> = ({
  openapiYaml,
  isStale,
  errors
}) => {
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(openapiYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      style={{
        borderTop: isStale ? "2px solid #f97316" : "1px solid var(--line)",
        background: "var(--surface)",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        height: isCollapsed ? "40px" : "260px",
        transition: "height 0.2s ease",
        fontFamily: "var(--font-sans)",
        boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.3)"
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 20px",
          background: "var(--surface-2)",
          borderBottom: isCollapsed ? "none" : "1px solid var(--line)",
          fontSize: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-2)",
              cursor: "pointer",
              fontSize: "12px",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            {isCollapsed ? "Expand" : "Collapse"}
          </button>
          <span style={{ fontWeight: 800, color: "var(--lime)", letterSpacing: "-0.2px" }}>
            OpenAPI 3.1 Contract Preview
          </span>
          <span
            style={{
              background: "var(--surface-3)",
              color: "var(--text-2)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: 600
            }}
          >
            Read-Only
          </span>

          {isStale && (
            <span
              style={{
                background: "#7c2d12",
                color: "#fdba74",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "10px",
                fontWeight: 700
              }}
            >
              Stale
            </span>
          )}

          {errors.length > 0 && (
            <span
              onClick={() => setShowErrors(!showErrors)}
              style={{
                background: "#991b1b",
                color: "#fca5a5",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer"
              }}
              title="Click to toggle errors"
            >
              {errors.length} {errors.length === 1 ? "Error" : "Errors"}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={handleCopy}
            disabled={!openapiYaml}
            style={{
              background: copied ? "var(--success)" : "var(--surface-3)",
              color: copied ? "#10120f" : "var(--text)",
              border: "1px solid var(--line)",
              borderRadius: "6px",
              padding: "4px 12px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: openapiYaml ? "pointer" : "not-allowed",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => {
              if (!copied && openapiYaml) e.currentTarget.style.borderColor = "var(--lime)";
            }}
            onMouseLeave={(e) => {
              if (!copied) e.currentTarget.style.borderColor = "var(--line)";
            }}
          >
            {copied ? "Copied Contract" : "Copy YAML"}
          </button>
        </div>
      </div>

      {/* Error dropdown if present */}
      {showErrors && errors.length > 0 && !isCollapsed && (
        <div
          style={{
            background: "#450a0a",
            color: "#fca5a5",
            padding: "10px 20px",
            fontSize: "12px",
            borderBottom: "1px solid #7f1d1d"
          }}
        >
          <strong>Validation Errors:</strong>
          <ul style={{ margin: "4px 0 0 0", paddingLeft: "20px" }}>
            {errors.map((e, idx) => (
              <li key={idx}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Code Display */}
      {!isCollapsed && (
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "14px 20px",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            lineHeight: 1.6,
            whiteSpace: "pre",
            color: "var(--text)",
            background: "var(--surface)"
          }}
        >
          {openapiYaml || "# Generating OpenAPI 3.1 contract..."}
        </div>
      )}
    </div>
  );
};
