"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap,
  useNodesState, useEdgesState, addEdge, useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api } from "../../../../lib/api";
import { nodeTypes } from "../../../../components/flow/nodes";
import BlockSidebar from "../../../../components/flow/BlockSidebar";
import ConfigPanel from "../../../../components/flow/ConfigPanel";

function Builder() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const wrapRef = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const [flow, setFlow] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    api(`/api/flows/${id}`).then((f) => {
      setFlow(f);
      setNodes(f.graph?.nodes || []);
      setEdges(f.graph?.edges || []);
    }).catch(() => router.push("/dashboard/automacao"));
  }, [id]);

  const onConnect = useCallback((c) => setEdges((es) => addEdge({ ...c, animated: true, style: { stroke: "#00FFB2", strokeWidth: 2 } }, es)), [setEdges]);

  const onDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }, []);
  const onDrop = useCallback((e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("application/zapflow-node");
    if (!type) return;
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const id = `${type}_${Date.now()}`;
    setNodes((ns) => ns.concat({ id, type, position, data: defaultData(type) }));
  }, [screenToFlowPosition, setNodes]);

  function defaultData(type) {
    if (type === "message") return { kind: "text", text: "", delay: 0 };
    if (type === "delay") return { value: 5, unit: "s" };
    if (type === "condition") return { op: "contains", value: "" };
    if (type === "action") return { kind: "end", value: "" };
    return {};
  }

  function updateSelected(updated) {
    setNodes((ns) => ns.map((n) => (n.id === updated.id ? updated : n)));
    setSelected(updated);
  }
  function deleteSelected() {
    if (!selected || selected.type === "trigger") return;
    setNodes((ns) => ns.filter((n) => n.id !== selected.id));
    setEdges((es) => es.filter((e) => e.source !== selected.id && e.target !== selected.id));
    setSelected(null);
  }

  async function save() {
    setSaving(true);
    try {
      await api(`/api/flows/${id}`, { method: "PATCH", body: { graph: { nodes, edges } } });
      setSavedAt(new Date());
    } finally { setSaving(false); }
  }

  async function toggleEnabled() {
    const updated = await api(`/api/flows/${id}`, { method: "PATCH", body: { enabled: !flow.enabled } });
    setFlow(updated);
  }

  if (!flow) return <div className="p-10 text-ink-400">Carregando...</div>;

  return (
    <div className="h-screen flex flex-col">
      {/* Topbar */}
      <header className="h-14 border-b border-white/[0.06] flex items-center px-5 gap-4 bg-bg/80 backdrop-blur-sm">
        <button onClick={() => router.push("/dashboard/automacao")} className="text-ink-300 hover:text-ink-100 text-sm">← Voltar</button>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{flow.name}</div>
          <div className="text-xs text-ink-400">{savedAt ? `salvo ${savedAt.toLocaleTimeString("pt-BR")}` : "alterações não salvas"}</div>
        </div>
        <button onClick={toggleEnabled} className={`px-3 py-1.5 rounded-lg text-sm ${flow.enabled ? "bg-primary/15 text-primary border border-primary/30" : "bg-white/5 text-ink-300 border border-white/10"}`}>
          {flow.enabled ? "● Ativa" : "○ Pausada"}
        </button>
        <button onClick={save} disabled={saving} className="px-4 py-1.5 rounded-lg bg-primary text-bg font-semibold text-sm hover:opacity-90 disabled:opacity-50">
          {saving ? "Salvando..." : "💾 Salvar"}
        </button>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Block sidebar */}
        <aside className="w-64 shrink-0 border-r border-white/[0.06] overflow-y-auto bg-bg/30">
          <BlockSidebar />
        </aside>

        {/* Canvas */}
        <div className="flex-1 relative" ref={wrapRef} onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, n) => setSelected(n)}
            onPaneClick={() => setSelected(null)}
            nodeTypes={nodeTypes}
            fitView
            colorMode="dark"
            defaultEdgeOptions={{ animated: true, style: { stroke: "#00FFB2", strokeWidth: 2 } }}
          >
            <Background gap={20} color="#1f2937" />
            <Controls />
            <MiniMap pannable zoomable className="!bg-bg2 !border !border-white/10" maskColor="rgba(0,0,0,0.6)" nodeColor={() => "#00FFB2"} />
          </ReactFlow>
        </div>

        {/* Config panel */}
        <aside className="w-80 shrink-0 border-l border-white/[0.06] overflow-y-auto bg-bg/30">
          <ConfigPanel node={selected} onChange={updateSelected} onDelete={deleteSelected} />
        </aside>
      </div>
    </div>
  );
}

export default function Page() {
  return <ReactFlowProvider><Builder /></ReactFlowProvider>;
}
