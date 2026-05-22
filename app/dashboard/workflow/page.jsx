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

// ── Modal: telefone de teste ─────────────────────────────────────
function TestModal({ open, onClose, onConfirm, sessions }) {
  const [phone, setPhone] = useState("");
  const [slot, setSlot] = useState(sessions[0]?.slot ?? "");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0B1120] shadow-2xl overflow-hidden"
      >
        <div className="h-1 w-full bg-gradient-to-r from-primary to-accent-blue" />
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-100">Testar fluxo</h3>
            <button onClick={onClose} className="text-ink-500 hover:text-ink-300 text-lg leading-none">✕</button>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-1.5">Número de destino</label>
            <input
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="11999998888"
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-primary/50 transition-colors placeholder:text-ink-600"
            />
            <p className="text-[10px] text-ink-600 mt-1">Apenas números, com DDD. Ex: 11999998888</p>
          </div>
          {sessions.length > 1 && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-1.5">Enviar pelo chip</label>
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
              >
                {sessions.map((s) => (
                  <option key={s.slot} value={s.slot}>Chip {s.slot}{s.phone ? ` · +${s.phone}` : ""}</option>
                ))}
              </select>
            </div>
          )}
          <button
            disabled={!phone.trim()}
            onClick={() => { if (phone.trim()) onConfirm(phone.trim(), slot); }}
            className="w-full py-2.5 rounded-xl bg-primary text-bg font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            Disparar teste
          </button>
        </div>
      </motion.div>
    </div>
  );
}

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
  const [flows, setFlows] = useState([]);
  const [flowsOpen, setFlowsOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [slotId, setSlotId] = useState(null); // null = todos os chips
  const [connectedSessions, setConnectedSessions] = useState([]);
  const [testOpen, setTestOpen] = useState(false);

  const loadFlows = useCallback(() => {
    return api("/api/workflows")
      .then((l) => { const arr = Array.isArray(l) ? l : []; setFlows(arr); return arr; })
      .catch(() => []);
  }, []);

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
    // Carrega sessões conectadas
    api("/api/sessions").then((list) => {
      const connected = (Array.isArray(list) ? list : []).filter((s) => s.status === "connected" || s.connected);
      setConnectedSessions(connected);
    }).catch(() => {});

    loadFlows()
      .then(async (list) => {
        if (!list?.length) return;
        const full = await api(`/api/workflows/${list[0].id}`);
        setWfId(full.id);
        setWfName(full.name || "Meu fluxo");
        setSlotId(full.session_slot ?? null);
        if (full.nodes?.length) setNodes(full.nodes);
        if (full.edges) setEdges(full.edges);
      })
      .catch(() => {});
  }, [setNodes, setEdges, loadFlows]);

  const openFlow = useCallback(async (id) => {
    setFlowsOpen(false);
    if (id === wfId) return;
    try {
      const full = await api(`/api/workflows/${id}`);
      setWfId(full.id);
      setWfName(full.name || "Fluxo");
      setSlotId(full.session_slot ?? null);
      setNodes(full.nodes?.length ? full.nodes : []);
      setEdges(full.edges || []);
      setSelectedId(null);
      flash("ok", `Fluxo "${full.name}" aberto`);
    } catch (e) {
      flash("err", "Falha ao abrir fluxo");
    }
  }, [wfId, setNodes, setEdges, flash]);

  const newFlow = useCallback(() => {
    setFlowsOpen(false);
    setWfId(null);
    setWfName("Novo fluxo");
    setNodes([{ id: "n1", type: "zap", position: { x: 80, y: 200 }, data: { kind: "trigger", triggerType: "new_conversation", description: "" } }]);
    setEdges([]);
    setSelectedId(null);
    flash("ok", "Novo fluxo — salve para persistir");
  }, [setNodes, setEdges, flash]);

  const patchFlow = useCallback(async (id, body, e) => {
    e?.stopPropagation();
    try {
      await api(`/api/workflows/${id}`, { method: "PUT", body });
      await loadFlows();
    } catch (err) { flash("err", err.message || "Falha ao atualizar fluxo"); }
  }, [loadFlows, flash]);

  const delFlow = useCallback(async (id, e) => {
    e?.stopPropagation();
    try {
      await api(`/api/workflows/${id}`, { method: "DELETE" });
      setConfirmDeleteId(null);
      const arr = await loadFlows();
      if (id === wfId) {
        if (arr.length) openFlow(arr[0].id); else newFlow();
      }
      flash("ok", "Fluxo excluído");
    } catch (err) { flash("err", "Falha ao excluir"); }
  }, [wfId, loadFlows, openFlow, newFlow, flash]);

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
        const payload = { name: wfName, nodes, edges, status, session_slot: slotId ?? null };
        let saved;
        if (wfId) {
          saved = await api(`/api/workflows/${wfId}`, { method: "PUT", body: payload });
        } else {
          saved = await api("/api/workflows", { method: "POST", body: payload });
          setWfId(saved.id);
        }
        flash("ok", status === "published" ? "Fluxo publicado ✓" : "Fluxo salvo ✓");
        loadFlows();
        return saved;
      } catch (e) {
        flash("err", e.message || "Falha ao salvar");
        return null;
      } finally {
        setBusy(null);
      }
    },
    [wfId, wfName, nodes, edges, slotId, flash, loadFlows]
  );

  const runTest = useCallback(async (phone, slot) => {
    setTestOpen(false);
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
              className="hidden md:block w-44 rounded-lg bg-bg/60 border border-white/10 px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
            {/* Seletor de chip */}
            {connectedSessions.length > 0 && (
              <select
                value={slotId ?? ""}
                onChange={(e) => setSlotId(e.target.value === "" ? null : Number(e.target.value))}
                title="Vincular fluxo a um chip específico"
                className="hidden sm:block rounded-lg bg-bg/60 border border-white/10 px-2.5 py-2 text-[12px] text-ink-200 outline-none focus:border-primary/60 cursor-pointer appearance-none"
              >
                <option value="">📡 Todos os chips</option>
                {connectedSessions.map((s) => (
                  <option key={s.slot} value={s.slot}>
                    🟢 Chip {s.slot}{s.phone ? ` · +${s.phone}` : ""}
                  </option>
                ))}
              </select>
            )}
            <div className="relative">
              <button
                onClick={() => setFlowsOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium border border-white/10 text-ink-200 hover:bg-white/[0.06] transition-colors"
              >
                <span>🗂️</span> Fluxos <span className="text-ink-500">({flows.length})</span>
              </button>
              <AnimatePresence>
                {flowsOpen && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => { setFlowsOpen(false); setConfirmDeleteId(null); }} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      className="fixed right-4 top-[68px] z-[61] w-80 rounded-2xl border border-white/[0.08] p-2 max-h-[70vh] overflow-y-auto"
                      style={{ background: "linear-gradient(180deg,#0B1120,#0F172A)", boxShadow: "0 24px 60px -20px rgba(0,0,0,0.8)" }}
                    >
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <span className="text-[11px] uppercase tracking-wider text-ink-500">Meus fluxos</span>
                        <button onClick={newFlow} className="text-[12px] font-semibold text-primary hover:underline">+ Novo</button>
                      </div>
                      {flows.length === 0 && (
                        <div className="px-3 py-4 text-[12px] text-ink-500">Nenhum fluxo salvo ainda.</div>
                      )}
                      {flows.map((f) => {
                        const cur = f.id === wfId;
                        return (
                          <div
                            key={f.id}
                            onClick={() => openFlow(f.id)}
                            className={`group rounded-xl px-2.5 py-2 cursor-pointer transition-colors ${cur ? "bg-primary/10 border border-primary/25" : "hover:bg-white/[0.05] border border-transparent"}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`size-1.5 rounded-full ${f.enabled === false ? "bg-ink-600" : "bg-primary"}`} />
                              <span className="text-[13px] font-medium text-ink-50 truncate flex-1">{f.name || "Sem nome"}</span>
                              {f.is_entry && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">ENTRADA</span>}
                              {f.enabled === false && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-ink-500">INATIVO</span>}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => patchFlow(f.id, { enabled: !(f.enabled !== false) }, e)}
                                className="text-[11px] px-2 py-0.5 rounded-md border border-white/10 text-ink-300 hover:text-ink-100">
                                {f.enabled === false ? "Ativar" : "Desativar"}
                              </button>
                              {!f.is_entry && (
                                <button onClick={(e) => patchFlow(f.id, { is_entry: true }, e)}
                                  className="text-[11px] px-2 py-0.5 rounded-md border border-primary/30 text-primary hover:bg-primary/10">
                                  Definir entrada
                                </button>
                              )}
                              {confirmDeleteId === f.id ? (
                                <div className="ml-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-[10px] text-ink-400">Confirmar?</span>
                                  <button onClick={(e) => delFlow(f.id, e)}
                                    className="text-[11px] px-2 py-0.5 rounded-md border border-red-500/50 text-red-400 bg-red-500/10 hover:bg-red-500/20 font-semibold">
                                    Sim
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                    className="text-[11px] px-2 py-0.5 rounded-md border border-white/10 text-ink-400 hover:text-ink-200">
                                    Não
                                  </button>
                                </div>
                              ) : (
                                <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(f.id); }}
                                  className="text-[11px] px-2 py-0.5 rounded-md border border-red-500/30 text-red-400 hover:bg-red-500/10 ml-auto">
                                  Excluir
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div className="px-2 py-1.5 text-[10px] text-ink-600">
                        O fluxo de <b>entrada</b> inicia conversas novas. Os demais são alcançados via bloco "Ir para fluxo".
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
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
                    <div className="fixed inset-0 z-[60]" onClick={() => setAiOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      className="fixed right-4 top-[68px] z-[61] w-72 rounded-2xl border border-white/[0.08] p-2"
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
            <Button variant="ghost" loading={busy === "test"} onClick={() => setTestOpen(true)} className="!py-2 !px-3 text-sm">
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
      <AnimatePresence>
        {testOpen && (
          <TestModal
            open={testOpen}
            sessions={connectedSessions}
            onClose={() => setTestOpen(false)}
            onConfirm={runTest}
          />
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
