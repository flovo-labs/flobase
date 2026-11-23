import React from "react";
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge
} from "reactflow";
import { RelationEdgeData } from "../lib/serialize.js";

export const RelationEdge: React.FC<EdgeProps<RelationEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? "var(--lime)" : "var(--lime-muted)",
          strokeWidth: selected ? 2.5 : 1.75,
          cursor: "pointer",
          transition: "stroke 0.2s ease, stroke-width 0.2s ease"
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: "var(--surface)",
            padding: "3px 9px",
            borderRadius: "6px",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: selected ? "var(--lime)" : "var(--text-2)",
            border: selected ? "1px solid var(--lime)" : "1px solid var(--line)",
            boxShadow: selected
              ? "0 0 0 1px var(--lime), 0 4px 12px rgba(184, 243, 74, 0.15)"
              : "0 2px 8px rgba(0, 0, 0, 0.3)",
            pointerEvents: "all",
            cursor: "pointer",
            userSelect: "none",
            transition: "all 0.15s ease"
          }}
          className="nodrag nopan"
        >
          {data?.sourceField || "relation"}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
