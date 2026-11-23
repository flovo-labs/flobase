import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  OnConnect
} from "reactflow";
import { ModelNode } from "./nodes/ModelNode.js";
import { RelationEdge } from "./edges/RelationEdge.js";
import { OpenAPIPreview } from "./components/OpenAPIPreview.js";
import { SidePanel } from "./components/SidePanel.js";
import {
  fetchSchema,
  saveSchema,
  fetchOpenApi
} from "./lib/api.js";
import {
  schemaToReactFlow,
  reactFlowToSchema,
  ModelNodeData,
  RelationEdgeData
} from "./lib/serialize.js";

const nodeTypes = {
  modelNode: ModelNode
};

const edgeTypes = {
  relationEdge: RelationEdge
};

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<ModelNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RelationEdgeData>([]);
  const [selectedNode, setSelectedNode] = useState<Node<ModelNodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge<RelationEdgeData> | null>(null);

  // OpenAPI Preview state
  const [openapiYaml, setOpenapiYaml] = useState<string>("");
  const [isStale, setIsStale] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State management for Debounce & Reverting invalid states
  const lastGoodSchemaRef = useRef<any>(null);
  const rawBaseSchemaRef = useRef<any>(null);
  const requestSeqRef = useRef<number>(0);
  const saveTimerRef = useRef<any>(null);
  const openapiTimerRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initial Load: Fetch schema from backend
  useEffect(() => {
    async function load() {
      try {
        const res = await fetchSchema();
        if (res.success && res.schema) {
          rawBaseSchemaRef.current = res.schema;
          lastGoodSchemaRef.current = JSON.parse(JSON.stringify(res.schema));
          const { nodes: initNodes, edges: initEdges } = schemaToReactFlow(res.schema);
          setNodes(initNodes);
          setEdges(initEdges);

          // Initial OpenAPI fetch
          const openapiRes = await fetchOpenApi(res.schema);
          setOpenapiYaml(openapiRes.openapi);
        } else if (res.error) {
          showToast(res.error);
        }
      } catch (err: any) {
        showToast(`Failed to connect to editor server: ${err.message}`);
      }
    }
    load();
  }, []);

  // 2. Synchronize Node and Edge data handlers
  const handleAddField = useCallback((modelName: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === modelName) {
          const fields = { ...node.data.fields };
          let newFieldName = "newField";
          let count = 1;
          while (fields[newFieldName]) {
            newFieldName = `newField${count++}`;
          }
          fields[newFieldName] = {
            name: newFieldName,
            type: "string"
          };
          return {
            ...node,
            data: { ...node.data, fields }
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const handleDeleteField = useCallback((modelName: string, fieldName: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === modelName) {
          const fields = { ...node.data.fields };
          delete fields[fieldName];
          return {
            ...node,
            data: { ...node.data, fields }
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const handleRenameModel = useCallback((oldName: string, newName: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === oldName) {
          return {
            ...node,
            id: newName,
            data: { ...node.data, modelName: newName }
          };
        }
        return node;
      })
    );
    setEdges((eds) =>
      eds.map((edge) => {
        let updated = false;
        let source = edge.source;
        let target = edge.target;
        if (edge.source === oldName) {
          source = newName;
          updated = true;
        }
        if (edge.target === oldName) {
          target = newName;
          updated = true;
        }
        return updated ? { ...edge, source, target } : edge;
      })
    );
  }, [setNodes, setEdges]);

  // Bind node methods
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onAddField: handleAddField,
          onDeleteField: handleDeleteField,
          onRenameModel: handleRenameModel
        }
      }))
    );
  }, [handleAddField, handleDeleteField, handleRenameModel, setNodes]);

  // 3. Connect handler for drawing edges between models
  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      const sourceField = `${params.target.toLowerCase()}Id`;
      const newEdge: Edge<RelationEdgeData> = {
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        source: params.source,
        target: params.target,
        type: "relationEdge",
        data: {
          sourceField,
          targetModel: params.target,
          type: "many-to-one"
        }
      };

      // Automatically add foreign key field to source node
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === params.source && !node.data.fields[sourceField]) {
            return {
              ...node,
              data: {
                ...node.data,
                fields: {
                  ...node.data.fields,
                  [sourceField]: {
                    name: sourceField,
                    type: "uuid",
                    references: `${params.target}.id`
                  }
                }
              }
            };
          }
          return node;
        })
      );

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setNodes, setEdges]
  );

  // 4. Debounced Data Sync (300ms) with Sequence Tracking & Rollback
  useEffect(() => {
    if (nodes.length === 0) return;

    clearTimeout(saveTimerRef.current);
    clearTimeout(openapiTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      const currentSeq = ++requestSeqRef.current;
      const serializedSchema = reactFlowToSchema(nodes, edges, rawBaseSchemaRef.current);

      try {
        const res = await saveSchema(serializedSchema, currentSeq);

        // Ignore out-of-order stale responses
        if (res.sequence !== undefined && res.sequence !== requestSeqRef.current) {
          return;
        }

        if (res.success) {
          lastGoodSchemaRef.current = JSON.parse(JSON.stringify(serializedSchema));
          setValidationErrors([]);
          setIsStale(false);
        } else if (res.errors) {
          // Rejection UX: rollback to last known good schema
          setValidationErrors(res.errors);
          showToast(`Validation Failed: ${res.errors[0]}`);

          if (lastGoodSchemaRef.current) {
            const { nodes: goodNodes, edges: goodEdges } = schemaToReactFlow(
              lastGoodSchemaRef.current
            );
            setNodes(goodNodes);
            setEdges(goodEdges);
          }
        }
      } catch (err: any) {
        showToast(`Save error: ${err.message}`);
      }
    }, 300);

    // Debounced OpenAPI generation (500ms)
    openapiTimerRef.current = setTimeout(async () => {
      const serialized = reactFlowToSchema(nodes, edges, rawBaseSchemaRef.current);
      try {
        const openapiRes = await fetchOpenApi(serialized);
        if (openapiRes.openapi) {
          setOpenapiYaml(openapiRes.openapi);
          setIsStale(false);
        } else {
          setIsStale(true);
        }
      } catch {
        setIsStale(true);
      }
    }, 500);

    return () => {
      clearTimeout(saveTimerRef.current);
      clearTimeout(openapiTimerRef.current);
    };
  }, [nodes, edges]);

  // Update selected node / edge
  const onNodeClick = (_: any, node: Node) => {
    setSelectedNode(node as Node<ModelNodeData>);
    setSelectedEdge(null);
  };

  const onEdgeClick = (_: any, edge: Edge) => {
    setSelectedEdge(edge as Edge<RelationEdgeData>);
    setSelectedNode(null);
  };

  const onPaneClick = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const addModel = () => {
    let baseName = "NewModel";
    let count = 1;
    while (nodes.some((n) => n.id === baseName)) {
      baseName = `NewModel${count++}`;
    }

    const newNode: Node<ModelNodeData> = {
      id: baseName,
      type: "modelNode",
      position: { x: 100 + nodes.length * 30, y: 100 + nodes.length * 30 },
      data: {
        modelName: baseName,
        fields: {
          id: {
            name: "id",
            type: "uuid",
            primaryKey: true
          }
        },
        onAddField: handleAddField,
        onDeleteField: handleDeleteField,
        onRenameModel: handleRenameModel
      }
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newNode);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", background: "var(--bg)" }}>
      {/* Toast notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "#450a0a",
            border: "1px solid #7f1d1d",
            color: "#fca5a5",
            padding: "10px 18px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 700,
            zIndex: 9999,
            boxShadow: "0 16px 32px rgba(0,0,0,0.5)",
            fontFamily: "var(--font-sans)"
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Top Navbar */}
      <div
        style={{
          height: "52px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Brand Mark */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                background: "var(--lime)",
                display: "inline-block"
              }}
            />
            <span style={{ fontWeight: 800, fontSize: "15px", letterSpacing: "-0.3px", color: "var(--text)" }}>
              uni<span style={{ color: "var(--lime)" }}>schema</span>
            </span>
          </div>
          <span style={{ color: "var(--line)" }}>|</span>
          <span
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--text-2)",
              background: "var(--surface-2)",
              padding: "2px 8px",
              borderRadius: "4px",
              border: "1px solid var(--line)"
            }}
          >
            PostgreSQL + REST (OpenAPI 3.1)
          </span>
        </div>

        <button
          onClick={addModel}
          style={{
            background: "var(--lime)",
            color: "var(--lime-ink)",
            border: "none",
            borderRadius: "7px",
            padding: "7px 16px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            transition: "all 0.15s ease",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--lime-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--lime)")}
        >
          <span>+</span> Add Model
        </button>
      </div>

      {/* Main Canvas Area */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }}>
        <div style={{ flex: 1, height: "100%", background: "var(--bg)" }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
          >
            <Background color="#1c221b" gap={20} size={1} />
            <Controls />
            <MiniMap
              nodeColor={() => "#b8f34a"}
              maskColor="rgba(16, 18, 15, 0.75)"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "8px"
              }}
            />
          </ReactFlow>
        </div>

        {/* Right Properties SidePanel */}
        <SidePanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          nodes={nodes}
          onUpdateNodeData={(nodeId, updated) => {
            setNodes((nds) =>
              nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...updated } } : n))
            );
          }}
          onUpdateEdgeData={(edgeId, updated) => {
            setEdges((eds) =>
              eds.map((e) =>
                e.id === edgeId
                  ? {
                      ...e,
                      data: {
                        sourceField: e.data?.sourceField ?? "",
                        targetModel: e.data?.targetModel ?? "",
                        ...e.data,
                        ...updated
                      }
                    }
                  : e
              )
            );
          }}
          onClose={() => {
            setSelectedNode(null);
            setSelectedEdge(null);
          }}
        />
      </div>

      {/* Collapsible OpenAPI 3.1 Live Preview Panel */}
      <OpenAPIPreview
        openapiYaml={openapiYaml}
        isStale={isStale}
        errors={validationErrors}
      />
    </div>
  );
}
