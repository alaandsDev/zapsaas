"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AnimatePresence, motion } from "framer-motion";
import Topbar from "../../../components/dashboard/Topbar";
import { Button } from "../../../components/ui/Field";
import FlowNode from "../../../components/workflow/FlowNode";
import NodePalette from "../../../components/workflow/NodePalette";
import { NODE_DEFS } from "../../../components/workflow/nodeTypes";
import { BlockEditorPanel, WorkflowWhatsappPreview, BLOCK_REGISTRY } from "../../../components/workflow/blockRegistry";
import { validateWorkflow } from "../../../components/workflow/blockMeta";
import { api } from "../../../lib/api";

let idSeq = 100;
const nextId = () => `n${idSeq++}`;

const INITIAL_NODES = [
  {
    id: "n1",
    type: "zap",
    position: { x: 60, y: 180 },
    data: { kind: "trigger", triggerType: "new_conversation", description: "Quando alguém envia a 1ª mensagem" },
  },
  {
    id: "n2",
    type: "zap",
    position: { x: 360, y: 120 },
    data: { kind: "message", text: "Olá! 👋 Que bom te ver por aqui. Como posso ajudar hoje?" },
  },
  {
    id: "n3",
    type: "zap",
    position: { x: 360, y: 320 },
    data: { kind: "delay", amount: 1, unit: "hours" },
  },
  {
    id: "n4",
    type: "zap",
    position: { x: 680, y: 320 },
    data: { kind: "ia", prompt: "Entenda a necessidade e responda com a melhor oferta.", goal: "qualify_lead", tone: "friendly" },
  },
];

const INITIAL_EDGES = [
  { id: "e1-2", source: "n1", target: "n2" },
  { id: "e1-3", source: "n1", target: "n3" },
  { id: "e3-4", source: "n3", target: "n4" },
];

const edgeOptions = {
  animated: true,
  style: { stroke: "#00FF88", strokeWidth: 2 },
  type: "smoothstep",
};

function Builder() {
  const wrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const nodeTypes = useMemo(() => ({ zap: FlowNode }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [selectedId, setSelectedId] = useState(null);
  const [wfId, setWfId] = useState(null);
  const [wfName, setWfName] = useState("Meu primeiro fluxo");
  const [busy, setBusy] = useState(null); // 'save' | 'publish' | 'test'
  const [toast, setToast] = useState(null); // { kind, msg }
  const [aiOpen, setAiOpen] = useState(false);

  const flash = useCallback((kind, msg) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const AI_TEMPLATES = [
    {
      key: "recuperacao",
      label: "Recuperação de leads",
      desc: "Reengaja quem parou de responder",
      build: () => {
        const N = [
          { kind: "trigger", title: "Lead sem resposta", body: "Sem interação há 24h" },
          { kind: "delay", title: "Aguardar 24h", body: "24 horas" },
          { kind: "message", title: "Reengajar", body: "Oi {nome}! Vi que você demonstrou interesse 👀 Ainda posso te ajudar?" },
          { kind: "condition", title: "Respondeu?", body: "Sim / Não" },
          { kind: "ia", title: "Qualificar resposta", body: "Entenda a objeção e ofereça a melhor solução." },
          { kind: "tag", title: "Marcar perdido", body: "tag: frio" },
        ];
        return graph(N, [[0,1],[1,2],[2,3],[3,4],[3,5]]);
      },
    },
    {
      key: "boasvindas",
      label: "Boas-vindas",
      desc: "Recebe e qualifica novos leads",
      build: () => {
        const N = [
          { kind: "trigger", title: "Novo lead", body: "Primeiro contato" },
          { kind: "message", title: "Boas-vindas", body: "Olá {nome}! 👋 Que bom te ver por aqui." },
          { kind: "delay", title: "Aguardar 10min", body: "10 minutos" },
          { kind: "ia", title: "Entender necessidade", body: "Pergunte o objetivo e responda com a melhor oferta." },
          { kind: "tag", title: "Classificar", body: "tag: novo" },
        ];
        return graph(N, [[0,1],[1,2],[2,3],[3,4]]);
      },
    },
    {
      key: "qualificacao",
      label: "Qualificação comercial",
      desc: "Separa quente de frio automaticamente",
      build: () => {
        const N = [
          { kind: "trigger", title: "Lead recebido", body: "Entrou no funil" },
          { kind: "ia", title: "Diagnóstico IA", body: "Identifique intenção e urgência da compra." },
          { kind: "condition", title: "Lead quente?", body: "Score alto?" },
          { kind: "message", title: "Acelerar venda", body: "{nome}, consigo uma condição especial pra você fechar hoje 🚀" },
          { kind: "tag", title: "Nutrir", body: "tag: morno" },
        ];
        return graph(N, [[0,1],[1,2],[2,3],[2,4]]);
      },
    },
  ];

  // Normalise AI template defs to registry data shapes
  function normalise(kind, partial) {
    const reg = BLOCK_REGISTRY[kind];
    const base = reg?.defaultData ? { ...reg.defaultData } : {};
    // Map legacy "body" / "title" fields to proper schema
    if (partial.body) {
      if (kind === "message") base.text = partial.body;
      else if (kind === "ia") base.prompt = partial.body;
      else if (kind === "delay") { const m = partial.body.match(/\d+/); base.amount = m ? parseInt(m[0]) : 1; base.unit = partial.body.includes("hora") ? "hours" : "minutes"; }
      else if (kind === "tag") { base.tags = [partial.body.replace("tag: ", "").trim()]; }
    }
    return { kind, ...base };
  }

  function graph(defs, links) {
    const ns = defs.map((d, i) => ({
      id: `ai${Date.now()}_${i}`,
      type: "zap",
      position: { x: 60 + (i % 3) * 300, y: 80 + Math.floor(i / 3) * 220 + (i % 2) * 60 },
      data: normalise(d.kind, d),
    }));
    const es = links.map(([a, b]) => ({
      id: `aie_${ns[a].id}_${ns[b].id}`,
      source: ns[a].id,
      target: ns[b].id,
      ...edgeOptions,
    }));
    return { ns, es };
  }

  function genFlow(tpl) {
    const { ns, es } = tpl.build();
    setNodes(ns);
    setEdges(es);
    setSelectedId(null);
    setAiOpen(false);
    setWfName(`IA · ${tpl.label}`);
    flash("ok", `Fluxo "${tpl.label}" gerado pela IA ✨`);
  }

  useEffect(() => {
    api("/api/workflows")
      .then(async (list) => {
        if (!list?.length) return;
        const full = await api(`/api/workflows/${list[0].id}`);
        setWfId(full.id);
        setWfName(full.name || "Meu fluxo");
        if (full.nodes?.length) setNodes(full.nodes);
        if (full.edges) setEdges(full.edges);
      })
      .catch(() => {});
  }, [setNodes, setEdges]);

  const persist = useCallback(
    async (status) => {
      if (status === "published") {
        const errors = validateWorkflow(nodes);
        if (errors.length > 0) {
          flash("err", `${errors.length} bloco${errors.length > 1 ? "s" : ""} com erro: ${errors[0].label} — ${errors[0].error}`);
          return null;
        }
      }
      const action = status === "published" ? "publish" : "save";
      setBusy(action);
      try {
        const payload = { name: wfName, nodes, edges, status };
        let saved;
        if (wfId) {
          saved = await api(`/api/workflows/${wfId}`, { method: "PUT", body: payload });
        } else {
          saved = await api("/api/workflows", { method: "POST", body: payload });
          setWfId(saved.id);
        }
        flash("ok", status === "published" ? "Fluxo publicado ✓" : "Fluxo salvo ✓");
        return saved;
      } catch (e) {
        flash("err", e.message || "Falha ao salvar");
        return null;
      } finally {
        setBusy(null);
      }
    },
    [wfId, wfName, nodes, edges, flash]
  );

  const testRun = useCallback(async () => {
    const phone = window.prompt("Número de teste (com DDD). Ex: 11999998888");
    if (!phone) return;
    setBusy("test");
    try {
      const saved = wfId ? { id: wfId } : await persist("draft");
      if (!saved) return;
      const r = await api(`/api/workflows/${saved.id}/run`, {
        method: "POST",
        body: { phone, name: "Teste" },
      });
      flash("ok", `Teste enviado · ${r.steps || 0} blocos executados`);
    } catch (e) {
      flash("err", e.message || "Falha no teste");
    } finally {
      setBusy(null);
    }
  }, [wfId, persist, flash]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, ...edgeOptions }, eds)),
    [setEdges]
  );

  const addNode = useCallback(
    (kind, position) => {
      const def = NODE_DEFS[kind];
      const reg = BLOCK_REGISTRY[kind];
      const pos = position || { x: 320 + Math.random() * 120, y: 120 + Math.random() * 200 };
      const id = nextId();
      setNodes((nds) => [
        ...nds,
        { id, type: "zap", position: pos, data: { kind, ...(reg?.defaultData || { body: "" }) } },
      ]);
      setSelectedId(id);
    },
    [setNodes]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const kind = e.dataTransfer.getData("application/zapflow-node");
      if (!kind || !NODE_DEFS[kind]) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addNode(kind, position);
    },
    [screenToFlowPosition, addNode]
  );

  const selected = nodes.find((n) => n.id === selectedId) || null;

  const patchSelected = (patch) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n))
    );
  };

  const deleteSelected = () => {
    setNodes((nds) => nds.filter((n) => n.id !== selectedId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedId && e.target !== selectedId));
    setSelectedId(null);
  };

  return (
    <>
      <Topbar
        title="Workflow Builder"
        subtitle="Desenhe automações visuais como um fluxo vivo"
        actions={
          <>
            <input
              value={wfName}
              onChange={(e) => setWfName(e.target.value)}
              className="hidden md:block w-48 rounded-lg bg-bg/60 border border-white/10 px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
            <div className="relative">
              <button
                onClick={() => setAiOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg,#7C3AED,#00D1FF)" }}
              >
                <span>✨</span> Gerar com IA
              </button>
              <AnimatePresence>
                {aiOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setAiOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      className="absolute right-0 top-11 z-50 w-72 rounded-2xl border border-white/[0.08] p-2"
                      style={{ background: "linear-gradient(180deg,#0B1120,#0F172A)", boxShadow: "0 24px 60px -20px rgba(0,0,0,0.8)" }}
                    >
                      <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-ink-500">IA monta o fluxo</div>
                      {AI_TEMPLATES.map((t) => (
                        <button
                          key={t.key}
                          onClick={() => genFlow(t)}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors"
                        >
                          <div className="text-[13px] font-semibold text-ink-50">{t.label}</div>
                          <div className="text-[11px] text-ink-500">{t.desc}</div>
                        </button>
                      ))}
                      <div className="px-3 py-1.5 text-[10px] text-ink-600">Substitui o canvas atual pelo fluxo gerado.</div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <Button variant="ghost" loading={busy === "test"} onClick={testRun} className="!py-2 !px-3 text-sm">
              Testar fluxo
            </Button>
            <Button variant="ghost" loading={busy === "save"} onClick={() => persist("draft")} className="!py-2 !px-3 text-sm">
              Salvar
            </Button>
            <Button loading={busy === "publish"} onClick={() => persist("published")} className="!py-2 !px-4 text-sm">
              Publicar
            </Button>
          </>
        }
      />
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -12, x: "-50%" }}
            className={`fixed top-20 left-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-medium border backdrop-blur-md ${
              toast.kind === "ok"
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-red-500/15 border-red-500/40 text-red-300"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        <NodePalette onAdd={(k) => addNode(k)} />

        <div
          ref={wrapper}
          className="flex-1 m-3 rounded-2xl border border-white/[0.06] overflow-hidden relative rf-canvas"
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(0,255,136,0.06), transparent 60%), radial-gradient(ellipse 50% 50% at 90% 100%, rgba(124,58,237,0.07), transparent 60%), #0B1020",
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, n) => setSelectedId(n.id)}
            onPaneClick={() => setSelectedId(null)}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={edgeOptions}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            proOptions={{ hideAttribution: true }}
            minZoom={0.3}
            maxZoom={1.6}
          >
            <Background variant={BackgroundVariant.Dots} gap={26} size={1.5} color="rgba(255,255,255,0.07)" />
            <Controls showInteractive={false} />
            <MiniMap
              pannable
              zoomable
              nodeColor={(n) => NODE_DEFS[n.data?.kind]?.color || "#00FF88"}
              maskColor="rgba(11,16,32,0.7)"
              style={{ background: "rgba(15,22,40,0.7)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </ReactFlow>

          <div className="absolute top-4 left-4 glass px-3 py-1.5 text-[11px] text-ink-300 flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            {nodes.length} blocos · {edges.length} conexões
          </div>
        </div>

        {/* Right rail: inspector + preview + AI */}
        <div className="w-[330px] shrink-0 overflow-y-auto p-3 pl-0 space-y-3">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="glass overflow-hidden"
              >
                <BlockEditorPanel
                  node={selected}
                  onChange={(updated) =>
                    setNodes((nds) => nds.map((n) => (n.id === updated.id ? updated : n)))
                  }
                  onDelete={deleteSelected}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass p-5 text-center space-y-2"
              >
                <div className="text-3xl opacity-20">🔲</div>
                <p className="text-[12px] text-ink-500 leading-relaxed">
                  Selecione um bloco no canvas para editar — o preview atualiza ao vivo.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="glass p-4">
            <WorkflowWhatsappPreview nodes={nodes} />
          </div>

          <AIPanel />
        </div>
      </div>
    </>
  );
}

export default function WorkflowPage() {
  return (
    <ReactFlowProvider>
      <Builder />
    </ReactFlowProvider>
  );
}
