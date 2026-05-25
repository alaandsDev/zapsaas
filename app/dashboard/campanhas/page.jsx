"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChevronLeft, ChevronRight, Send, Users, Calendar,
  ClipboardCheck, MessageSquare, Paperclip, ShieldCheck,
  Zap, Plus, Trash2, Search, X, BookmarkPlus,
} from "lucide-react";
import Topbar from "../../../components/dashboard/Topbar";
import Modal from "../../../components/dashboard/Modal";
import { Field, Input, Textarea, Select, Button } from "../../../components/ui/Field";
import { api, API_URL, getToken } from "../../../lib/api";

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch { return "—"; }
}

const STATUS = {
  pending: { label: "Pendente", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" },
  scheduled: { label: "⏰ Agendado", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" },
  sending: { label: "Enviando...", cls: "bg-accent-blue/15 text-accent-blue border-accent-blue/30" },
  completed: { label: "Concluído", cls: "bg-primary/15 text-primary border-primary/30" },
  failed: { label: "Falhou", cls: "bg-red-500/15 text-red-300 border-red-500/30" },
  paused: { label: "⏸ Pausado", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" },
  cancelled: { label: "✕ Cancelado", cls: "bg-red-500/15 text-red-300 border-red-500/30" },
};

const STEPS = [
  { n: 1, label: "Mensagem", Icon: MessageSquare },
  { n: 2, label: "Destinatários", Icon: Users },
  { n: 3, label: "Agendamento", Icon: Calendar },
  { n: 4, label: "Revisão", Icon: ClipboardCheck },
];

export default function CampanhasPage() {
  const [wpp, setWpp] = useState(null);
  const [lists, setLists] = useState([]);
  const [leads, setLeads] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [detailOpen, setDetailOpen] = useState(null);
  const [usage, setUsage] = useState(null);
  const [messages, setMessages] = useState([{ id: Date.now(), text: "" }]);
  const [listSel, setListSel] = useState("");
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [delay, setDelay] = useState(3);
  const [pauseEvery, setPauseEvery] = useState(25);
  const [pauseDuration, setPauseDuration] = useState(5);
  const [schedule, setSchedule] = useState("");
  const [dualChip, setDualChip] = useState(false);
  const [sourceSessionSlot, setSourceSessionSlot] = useState("");
  const [channel, setChannel] = useState("auto"); // "auto" | "baileys" | "cloud"
  const [cloudConfig, setCloudConfig] = useState(null);
  const [media, setMedia] = useState(null); // { url, mimetype, filename, type, size }
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState(1);
  const textareaRefs = useRef({});

  const [sessions, setSessions] = useState([]);

  // ── Templates de Mensagens Rápidas ────────────────────────────
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [activeTemplateFor, setActiveTemplateFor] = useState(null); // message id

  useEffect(() => {
    api("/api/message-templates").then(setTemplates).catch(() => {});
  }, []);

  async function addTemplate(name, text) {
    if (!text.trim()) return;
    try {
      const tpl = await api("/api/message-templates", { method: "POST", body: { name, text } });
      setTemplates(prev => [tpl, ...prev]);
    } catch { /* ignore */ }
  }

  async function deleteTemplate(id) {
    setTemplates(prev => prev.filter(t => t.id !== id));
    await api(`/api/message-templates/${id}`, { method: "DELETE" }).catch(() => {});
  }

  function applyTemplate(text, msgId) {
    const id = msgId || (messages[0]?.id);
    if (!id) return;
    updateMessage(id, text);
    setShowTemplates(false);
  }

  const filteredTemplates = templates.filter(t =>
    !templateSearch || t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    t.text.toLowerCase().includes(templateSearch.toLowerCase())
  );

  async function loadAll() {
    const [w, ls, lds, ds, u, sess, cloud] = await Promise.all([
      api("/api/whatsapp/status").catch(() => null),
      api("/api/lists").catch(() => []),
      api("/api/leads").catch(() => []),
      api("/api/dispatches").catch(() => []),
      api("/api/usage").catch(() => null),
      api("/api/whatsapp/sessions").catch(() => []),
      api("/api/wpp-cloud/config").catch(() => null),
    ]);
    setWpp(w);
    setLists(Array.isArray(ls) ? ls : ls?.data || []);
    setLeads(Array.isArray(lds) ? lds : lds?.data || []);
    setDispatches(Array.isArray(ds) ? ds : ds?.data || []);
    setUsage(u);
    setSessions(Array.isArray(sess) ? sess : []);
    setCloudConfig(cloud);
  }
  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    (async () => {
      if (!listSel) { setContacts([]); setSelected(new Set()); return; }
      if (listSel === "leads") {
        const arr = leads.map(l => ({ phone: l.phone, name: l.name, _leadId: l.id }));
        setContacts(arr);
        setSelected(new Set(arr.map(c => c.phone)));
      } else if (listSel.startsWith("list:")) {
        const id = listSel.replace("list:", "");
        try {
          const list = await api(`/api/lists/${id}`);
          const arr = (list.contacts || []).map(c => ({
            phone: c.NUMERO || c.numero || c.phone || "",
            name: c.NOME || c.nome || c.name || "",
          }));
          setContacts(arr);
          setSelected(new Set(arr.map(c => c.phone)));
        } catch { setContacts([]); }
      }
    })();
  }, [listSel, leads]);

  function addMessage() {
    setMessages(m => [...m, { id: Date.now(), text: "" }]);
  }
  function removeMessage(id) {
    setMessages(m => m.length <= 1 ? m : m.filter(x => x.id !== id));
  }
  function updateMessage(id, text) {
    setMessages(m => m.map(x => x.id === id ? { ...x, text } : x));
  }
  function insertVar(id, variable) {
    const ta = textareaRefs.current[id];
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const v = ta.value;
    const next = v.slice(0, start) + variable + v.slice(end);
    updateMessage(id, next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  }
  function toggle(phone) {
    setSelected(s => {
      const next = new Set(s);
      next.has(phone) ? next.delete(phone) : next.add(phone);
      return next;
    });
  }
  function selectAll() { setSelected(new Set(contacts.map(c => c.phone))); }
  function deselectAll() { setSelected(new Set()); }

  async function sendDispatch() {
    setErr("");
    setOk("");
    const msgs = messages.map(m => m.text.trim()).filter(Boolean);
    if (!msgs.length) { setErr("Digite pelo menos uma mensagem"); setStep(1); return; }

    const connectedSessions = sessions.filter(s => s.status === "connected");
    const selectedSourceSlot = sourceSessionSlot ? parseInt(sourceSessionSlot) : null;
    if (selectedSourceSlot && !connectedSessions.some(s => s.slot === selectedSourceSlot)) {
      setErr("Selecione um número conectado para disparar");
      return;
    }
    if (!connectedSessions.length) { setErr("Conecte o WhatsApp em Conexões antes de disparar"); return; }

    if (dualChip && connectedSessions.length < 2) {
      setErr("Modo 2 Chips requer 2 números conectados. Vá em Conexões e conecte o segundo número.");
      return;
    }

    const phonesArr = contacts.filter(c => selected.has(c.phone));
    if (!phonesArr.length) { setErr("Selecione pelo menos um contato"); setStep(2); return; }

    const phonesWithMsg = phonesArr.map((p, i) => ({
      phone: p.phone,
      name: p.name || "",
      text: msgs[i % msgs.length]
        .replace(/\{nome\}/gi, p.name || "")
        .replace(/\{name\}/gi, p.name || "")
        .replace(/\{numero\}/gi, p.phone || ""),
    }));

    setSending(true);
    try {
      const isLeads = listSel === "leads";
      if (isLeads && msgs.length === 1) {
        const msg = await api("/api/messages", {
          method: "POST",
          body: { title: `Disparo ${new Date().toLocaleDateString("pt-BR")}`, content: msgs[0], tags: [] },
        });
        const contactIds = phonesArr.map(p => p._leadId).filter(Boolean);
        await api("/api/dispatches", {
          method: "POST",
          body: {
            messageId: msg.id,
            contactIds,
            useWhatsapp: true,
            channel,
            dualChip,
            sourceSessionSlot: selectedSourceSlot || undefined,
            scheduledAt: schedule ? new Date(schedule).toISOString() : undefined,
          },
        });
      } else {
        const result = await api("/api/whatsapp/bulk", {
          method: "POST",
          body: {
            phones: phonesWithMsg,
            message: msgs[0],
            multiMessage: true,
            dualChip,
            channel,
            sourceSessionSlot: selectedSourceSlot || undefined,
            mediaUrl: media?.url || undefined,
            mediaMimetype: media?.mimetype || undefined,
            mediaFilename: media?.originalname || media?.filename || undefined,
            delay: parseInt(delay) || 3,
            pauseEvery: parseInt(pauseEvery) || 0,
            pauseDuration: parseInt(pauseDuration) || 5,
            scheduledAt: schedule ? new Date(schedule).toISOString() : undefined,
          },
        });
        const origin = selectedSourceSlot ? ` pelo Número ${selectedSourceSlot}` : dualChip ? " em modo 2 chips" : "";
        setOk(`${result.message || "Disparo iniciado!"} ${result.total || phonesWithMsg.length} contato(s)${origin}.`);
      }
      if (isLeads && msgs.length === 1) {
        const origin = selectedSourceSlot ? ` pelo Número ${selectedSourceSlot}` : dualChip ? " em modo 2 chips" : "";
        setOk(`${schedule ? "Disparo agendado!" : "Disparo iniciado!"} ${phonesWithMsg.length} contato(s)${origin}.`);
      }
      setSchedule("");
      setMessages([{ id: Date.now(), text: "" }]);
      setListSel("");
      setStep(1);
      loadAll();
    } catch (e) {
      setErr(e.message || "Erro no disparo");
    } finally {
      setSending(false);
    }
  }

  async function uploadMedia(file) {
    setUploadingMedia(true);
    setErr("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/api/media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMedia(data);
    } catch (e) {
      setErr(e.message || "Erro no upload do arquivo");
    } finally {
      setUploadingMedia(false);
    }
  }

  function removeMedia() { setMedia(null); }

  const isPro = usage?.plan === "pro";
  const used = usage?.dispatches?.used ?? 0;
  const limit = usage?.dispatches?.limit ?? 3;
  const wppConnected = wpp?.status === "connected" || sessions.some(s => s.status === "connected");

  const msgCount = messages.filter(m => m.text.trim()).length;
  const canContinue = step === 1 ? msgCount > 0 : step === 2 ? selected.size > 0 : true;
  const firstMsgPreview = (messages.find(m => m.text.trim())?.text || "")
    .replace(/\{nome\}/gi, "Maria").replace(/\{numero\}/gi, "5511999998888");

  function next() { if (canContinue && step < 4) setStep(step + 1); }
  function back() { if (step > 1) setStep(step - 1); }

  const Stepper = (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
      {STEPS.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        const SIcon = s.Icon;
        return (
          <div key={s.n} className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => s.n < step && setStep(s.n)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm transition-all ${
                active ? "border-primary/40 bg-primary/10 text-primary"
                : done ? "border-primary/20 text-primary/80 hover:bg-primary/[0.06]"
                : "border-white/[0.06] text-ink-500"
              }`}
            >
              <span className={`size-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                done ? "bg-primary text-bg" : active ? "bg-primary/20 text-primary" : "bg-white/[0.05] text-ink-500"
              }`}>
                {done ? <Check className="size-3" /> : s.n}
              </span>
              <span className="hidden sm:flex items-center gap-1.5"><SIcon className="size-3.5" />{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <div className={`w-6 h-px ${done ? "bg-primary/40" : "bg-white/[0.08]"}`} />}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <Topbar title="Disparos" subtitle="Crie e acompanhe suas campanhas" />
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16">

        <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="rounded-2xl border border-white/[0.06] p-5 lg:p-6"
            style={{ background: "linear-gradient(160deg, #0B1120, #0F172A)" }}>
            {Stepper}

            {!isPro && (
              <div className="text-xs px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-ink-300 mb-4">
                📊 Disparos este mês: <strong className={used >= limit ? "text-red-400" : "text-ink-100"}>{used}/{limit}</strong>
                {used >= limit && <Link href="/dashboard/workspace" className="ml-3 text-primary font-semibold">Upgrade →</Link>}
              </div>
            )}
            {!wppConnected && (
              <div className="text-sm px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 mb-4">
                ⚠️ Nenhuma conexão ativa — <Link href="/dashboard/canais" className="underline">conecte em Conexões</Link>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* ── STEP 1: MENSAGEM ── */}
                {step === 1 && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-ink-100">
                          Mensagens <span className="text-xs text-ink-500 font-normal">(cada número recebe 1 em sequência)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowTemplates(v => !v)}
                            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all
                              ${showTemplates ? "bg-secondary/15 border-secondary/30 text-secondary" : "bg-white/[0.04] border-white/10 text-ink-300 hover:text-ink-100 hover:border-white/20"}`}
                          >
                            <Zap className="size-3.5" />
                            Mensagens Rápidas
                            {templates.length > 0 && (
                              <span className="size-4 rounded-full bg-secondary/20 text-secondary text-[9px] font-bold flex items-center justify-center">
                                {templates.length}
                              </span>
                            )}
                          </button>
                          <button type="button" onClick={addMessage} className="text-xs text-primary hover:underline">+ Adicionar</button>
                        </div>
                      </div>

                      {/* ── Painel de Templates ── */}
                      <AnimatePresence>
                        {showTemplates && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden mb-3"
                          >
                            <div className="rounded-xl border border-secondary/20 bg-secondary/[0.04] p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Zap className="size-4 text-secondary" />
                                  <span className="text-sm font-semibold text-ink-100">Mensagens Rápidas</span>
                                </div>
                                <button onClick={() => setShowTemplates(false)} className="text-ink-500 hover:text-ink-200">
                                  <X className="size-4" />
                                </button>
                              </div>

                              {/* Salvar mensagem atual como template */}
                              {messages.some(m => m.text.trim()) && (
                                <div className="mb-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                                  <p className="text-xs text-ink-400 mb-2">Salvar mensagem atual como template:</p>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={templateName}
                                      onChange={e => setTemplateName(e.target.value)}
                                      placeholder="Nome do template (opcional)"
                                      className="flex-1 rounded-lg bg-bg/80 border border-white/10 px-2.5 py-1.5 text-xs text-ink-100 placeholder:text-ink-500 outline-none focus:border-secondary/40"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const activeMsg = messages.find(m => m.text.trim());
                                        if (activeMsg) {
                                          addTemplate(templateName, activeMsg.text);
                                          setTemplateName("");
                                        }
                                      }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/15 border border-secondary/25 text-secondary text-xs hover:bg-secondary/25 transition-colors whitespace-nowrap"
                                    >
                                      <BookmarkPlus className="size-3.5" />
                                      Salvar
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Busca */}
                              {templates.length > 2 && (
                                <div className="relative mb-3">
                                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-500" />
                                  <input
                                    type="text"
                                    value={templateSearch}
                                    onChange={e => setTemplateSearch(e.target.value)}
                                    placeholder="Buscar template..."
                                    className="w-full rounded-lg bg-bg/60 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-ink-100 placeholder:text-ink-500 outline-none focus:border-secondary/40"
                                  />
                                </div>
                              )}

                              {/* Lista de templates */}
                              {filteredTemplates.length === 0 ? (
                                <div className="text-center py-6 text-xs text-ink-500">
                                  {templates.length === 0
                                    ? "Nenhum template salvo ainda. Escreva uma mensagem e salve acima!"
                                    : "Nenhum template encontrado"}
                                </div>
                              ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                  {filteredTemplates.map(tpl => (
                                    <div key={tpl.id} className="group flex items-start gap-2 p-3 rounded-lg border border-white/[0.06] bg-bg/40 hover:border-secondary/20 hover:bg-secondary/[0.04] transition-all">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-ink-200 mb-0.5 truncate">{tpl.name}</p>
                                        <p className="text-xs text-ink-400 line-clamp-2 whitespace-pre-wrap">{tpl.text}</p>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {messages.length > 1 ? (
                                          <div className="flex gap-1">
                                            {messages.map((m, i) => (
                                              <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => applyTemplate(tpl.text, m.id)}
                                                title={`Usar na mensagem ${i + 1}`}
                                                className="size-6 rounded bg-secondary/15 border border-secondary/25 text-secondary text-[10px] font-bold flex items-center justify-center hover:bg-secondary/30"
                                              >
                                                {i + 1}
                                              </button>
                                            ))}
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => applyTemplate(tpl.text, messages[0]?.id)}
                                            className="px-2.5 py-1 rounded bg-secondary/15 border border-secondary/25 text-secondary text-[10px] font-semibold hover:bg-secondary/30 transition-colors whitespace-nowrap"
                                          >
                                            Usar
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => deleteTemplate(tpl.id)}
                                          className="size-6 rounded bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                                        >
                                          <Trash2 className="size-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="space-y-3">
                        {messages.map((m, i) => (
                          <div key={m.id} className="rounded-xl border border-white/10 bg-bg/40 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="size-5 rounded-full bg-primary text-bg text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                                <span className="text-xs font-semibold text-ink-300 uppercase tracking-wide">Mensagem {i + 1}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => insertVar(m.id, "{nome}")} className="text-xs px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20">+ {"{nome}"}</button>
                                <button type="button" onClick={() => insertVar(m.id, "{numero}")} className="text-xs px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20">+ {"{numero}"}</button>
                                {messages.length > 1 && (
                                  <button type="button" onClick={() => removeMessage(m.id)} className="text-xs px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20">✕</button>
                                )}
                              </div>
                            </div>
                            <textarea
                              ref={(el) => { textareaRefs.current[m.id] = el; }}
                              value={m.text}
                              onChange={(e) => updateMessage(m.id, e.target.value)}
                              placeholder={`Digite a mensagem ${i + 1} aqui...`}
                              rows={4}
                              className="w-full rounded-lg bg-bg/60 border border-white/10 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 outline-none focus:border-primary/60 resize-y"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-ink-500 mt-2">💡 Nº1 vai pro contato 1, Nº2 pro contato 2... evita padrão e reduz risco de banimento</div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-ink-100 flex items-center gap-1.5">
                          <Paperclip className="size-4" /> Anexo <span className="text-xs text-ink-500 font-normal">(opcional)</span>
                        </label>
                        {media && <button type="button" onClick={removeMedia} className="text-xs text-red-400 hover:text-red-300">✕ Remover</button>}
                      </div>
                      {!media ? (
                        <label className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all cursor-pointer p-6
                          ${uploadingMedia ? "border-primary/40 bg-primary/5" : "border-white/10 hover:border-white/25 hover:bg-white/[0.02]"}`}>
                          <input type="file" className="hidden"
                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.csv,.txt"
                            onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0])}
                            disabled={uploadingMedia} />
                          {uploadingMedia ? (
                            <><span className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-ink-400">Enviando...</span></>
                          ) : (
                            <><Paperclip className="size-6 text-ink-500" />
                            <span className="text-xs text-ink-400 text-center">Clique ou arraste o arquivo aqui · Máx. 64 MB</span></>
                          )}
                        </label>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/25 bg-primary/5">
                          <span className="text-2xl flex-shrink-0">
                            {media.type === "image" ? "🖼️" : media.type === "video" ? "🎥" : media.type === "audio" ? "🎵" : "📄"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-ink-100 truncate">{media.originalname || media.filename}</div>
                            <div className="text-xs text-ink-400 mt-0.5">{media.type} · {media.size ? (media.size / 1024 / 1024).toFixed(2) + " MB" : ""}</div>
                          </div>
                          {media.type === "image" && media.url && (
                            <img src={media.url} alt="" className="size-12 rounded-lg object-cover flex-shrink-0" />
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* ── STEP 2: DESTINATÁRIOS ── */}
                {step === 2 && (
                  <>
                    <Field label="Lista de Contatos">
                      <Select value={listSel} onChange={(e) => setListSel(e.target.value)}>
                        <option value="">— Selecione uma lista —</option>
                        <option value="leads">👥 Leads do sistema ({leads.length})</option>
                        {lists.map(l => (
                          <option key={l.id} value={`list:${l.id}`}>📋 {l.name} ({l.total || l.contacts_count || 0} contatos)</option>
                        ))}
                      </Select>
                    </Field>
                    {contacts.length > 0 ? (
                      <div className="rounded-xl border border-white/10 p-3">
                        <div className="flex items-center gap-3 text-xs mb-2">
                          <button onClick={selectAll} className="text-primary font-medium">Selecionar todos</button>
                          <span className="text-ink-500">|</span>
                          <button onClick={deselectAll} className="text-ink-300">Desmarcar todos</button>
                          <span className="ml-auto text-ink-500">{selected.size} selecionados</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {contacts.map((c) => (
                            <label key={c.phone} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.04] cursor-pointer text-sm">
                              <input type="checkbox" checked={selected.has(c.phone)} onChange={() => toggle(c.phone)} className="accent-primary" />
                              <span className="flex-1 truncate">{c.name || "—"}</span>
                              <span className="text-xs text-ink-500 font-mono">{c.phone}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-ink-500 border border-dashed border-white/10 rounded-xl py-8 text-center">
                        Selecione uma lista para escolher os destinatários
                      </div>
                    )}
                  </>
                )}

                {/* ── STEP 3: AGENDAMENTO + ENVIO ── */}
                {step === 3 && (
                  <>
                    <Field label="Quando enviar" hint="Deixe em branco para disparar imediatamente">
                      <Input type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} />
                    </Field>

                    <div className="rounded-xl border border-white/10 bg-bg/40 p-4 space-y-3">
                      <div className="text-xs font-semibold text-ink-300 uppercase tracking-wide">⏱️ Configurações de envio</div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Delay entre msgs (seg)" hint="Recomendado: 3–10 seg">
                          <Input type="number" min={1} max={60} value={delay} onChange={(e) => setDelay(e.target.value)} />
                        </Field>
                        <Field label="Pausar a cada X msgs" hint="0 = sem pausa">
                          <Input type="number" min={0} max={1000} value={pauseEvery} onChange={(e) => setPauseEvery(e.target.value)} />
                        </Field>
                      </div>
                      {parseInt(pauseEvery) > 0 && (
                        <Field label="Duração da pausa (minutos)">
                          <Input type="number" min={1} max={60} value={pauseDuration} onChange={(e) => setPauseDuration(e.target.value)} />
                        </Field>
                      )}
                    </div>

                    {(() => {
                      const connectedSessions = sessions.filter(s => s.status === "connected");
                      const hasAny = connectedSessions.length > 0;
                      const hasTwo = connectedSessions.length >= 2;
                      const selectedSource = sourceSessionSlot ? connectedSessions.find(s => String(s.slot) === sourceSessionSlot) : null;
                      const hasCloudCfg = !!(cloudConfig?.has_token && cloudConfig?.enabled);
                      return (
                        <div className="rounded-xl border border-white/10 bg-bg/40 p-4 space-y-3">
                          <div className="text-xs font-semibold text-ink-300 uppercase tracking-wide">📱 Conexões de saída</div>
                          {!hasAny ? (
                            <div className="text-sm px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300">
                              ⚠️ Nenhum número conectado — <Link href="/dashboard/canais" className="underline font-semibold">conectar agora</Link>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {connectedSessions.map(s => (
                                <div key={s.slot} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/25 text-sm">
                                  <span className="size-2 rounded-full bg-primary" />
                                  <span className="font-medium text-primary">Número {s.slot}</span>
                                  {s.phone && <span className="text-ink-400 text-xs">+{s.phone}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                          {hasAny && (
                            <Field label="Número de disparo"
                              hint={selectedSource ? `Sai pelo Número ${selectedSource.slot}${selectedSource.phone ? ` (+${selectedSource.phone})` : ""}.` : "Automático usa o primeiro; 2 Chips alterna entre os dois."}>
                              <Select value={sourceSessionSlot}
                                onChange={(e) => { setSourceSessionSlot(e.target.value); if (e.target.value) setDualChip(false); }}
                                disabled={channel === "cloud"}>
                                <option value="">Automático</option>
                                {connectedSessions.map(s => (
                                  <option key={s.slot} value={s.slot}>Número {s.slot}{s.phone ? ` (+${s.phone})` : ""}</option>
                                ))}
                              </Select>
                            </Field>
                          )}
                          <div>
                            <div className="text-xs font-semibold text-ink-400 mb-2 uppercase tracking-wide">Canal de envio</div>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { value: "auto", icon: "⚡", label: "Automático", desc: "Canal disponível" },
                                { value: "baileys", icon: "📱", label: "WhatsApp", desc: "Número conectado" },
                                { value: "cloud", icon: "☁️", label: "API Meta", desc: "Business API" },
                              ].map(opt => {
                                const disabled = opt.value === "cloud" && !hasCloudCfg;
                                const active = channel === opt.value;
                                return (
                                  <button key={opt.value} type="button" disabled={disabled}
                                    onClick={() => { if (disabled) return; setChannel(opt.value); if (opt.value === "cloud") { setSourceSessionSlot(""); setDualChip(false); } }}
                                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-center transition-all
                                      ${disabled ? "opacity-30 cursor-not-allowed border-white/10 bg-white/[0.02]" :
                                        active ? "border-primary/50 bg-primary/10 text-primary" :
                                        "border-white/10 bg-white/[0.02] hover:border-white/20 text-ink-300"}`}>
                                    <span className="text-base">{opt.icon}</span>
                                    <span className="text-xs font-semibold">{opt.label}</span>
                                    <span className="text-[10px] text-ink-500">{disabled ? "Não configurado" : opt.desc}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div
                            onClick={() => { if (!hasTwo) return; setDualChip(v => { const n = !v; if (n) setSourceSessionSlot(""); return n; }); }}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer select-none
                              ${!hasTwo ? "opacity-40 cursor-not-allowed border-white/10 bg-white/[0.02]" :
                                dualChip ? "border-primary/40 bg-primary/8" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                            <div className="flex items-center gap-3">
                              <span className="text-lg">🔄</span>
                              <div>
                                <div className="text-sm font-semibold flex items-center gap-2">
                                  Modo 2 Chips
                                  {!hasTwo && <span className="text-xs font-normal text-ink-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">Requer 2 números</span>}
                                </div>
                                <div className="text-xs text-ink-400 mt-0.5">Alterna entre os 2 números — reduz risco de banimento</div>
                              </div>
                            </div>
                            <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${dualChip && hasTwo ? "bg-primary" : "bg-white/10"}`}>
                              <div className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${dualChip && hasTwo ? "translate-x-5" : "translate-x-0.5"}`} />
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}

                {/* ── STEP 4: REVISÃO ── */}
                {step === 4 && (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold mb-1">Resumo da campanha</div>
                    {[
                      ["Mensagens", `${msgCount} variação(ões)`],
                      ["Destinatários", `${selected.size} contato(s)`],
                      ["Lista", listSel === "leads" ? "Leads do sistema" : (lists.find(l => `list:${l.id}` === listSel)?.name || "—")],
                      ["Quando", schedule ? new Date(schedule).toLocaleString("pt-BR") : "Agora"],
                      ["Canal", channel === "cloud" ? "API Meta" : channel === "baileys" ? "WhatsApp" : "Automático"],
                      ["Modo", dualChip ? "2 Chips (alternância)" : sourceSessionSlot ? `Número ${sourceSessionSlot}` : "Automático"],
                      ["Delay / Pausa", `${delay}s · pausa a cada ${pauseEvery || 0}`],
                      ["Anexo", media ? (media.originalname || media.filename) : "Nenhum"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-3 text-sm border-b border-white/[0.05] pb-2">
                        <span className="text-ink-500">{k}</span>
                        <span className="text-ink-100 font-medium text-right">{v}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-xs text-ink-400 mt-3 px-3 py-2.5 rounded-xl border border-primary/20 bg-primary/[0.04]">
                      <ShieldCheck className="size-4 text-primary shrink-0" />
                      Envio em conformidade com as políticas do WhatsApp. Respeite consentimento dos contatos.
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mt-4">{err}</div>}
            {ok && <div className="text-sm text-primary bg-primary/10 border border-primary/25 rounded-xl px-4 py-3 mt-4">{ok}</div>}

            <div className="flex items-center justify-between gap-2 mt-6 pt-4 border-t border-white/[0.06]">
              <Button variant="ghost" onClick={back} disabled={step === 1} className="!py-2.5">
                <ChevronLeft className="size-4" /> Voltar
              </Button>
              {step < 4 ? (
                <Button onClick={next} disabled={!canContinue} className="!py-2.5">
                  Continuar <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button onClick={sendDispatch} loading={sending} className="!py-2.5 flex-1 sm:flex-none">
                  <Send className="size-4" /> Confirmar e enviar
                </Button>
              )}
            </div>
          </div>

          {/* Pré-visualização */}
          <div className="rounded-2xl border border-white/[0.06] p-5 lg:sticky lg:top-4"
            style={{ background: "linear-gradient(160deg, #0B1120, #0F172A)" }}>
            <div className="text-sm font-semibold mb-3">Pré-visualização</div>
            <div className="rounded-2xl border border-white/10 bg-[#0b141a] p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-7 rounded-full bg-gradient-to-br from-primary to-accent-blue" />
                <div className="text-xs">
                  <div className="font-semibold text-white">Seu Número</div>
                  <div className="text-[10px] text-emerald-400">online</div>
                </div>
              </div>
              <div className="bg-[#202c33] rounded-xl rounded-tl-sm px-3 py-2 text-[13px] text-[#e9edef] whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                {firstMsgPreview || <span className="text-ink-600 italic">Sua mensagem aparece aqui…</span>}
                {media && <div className="mt-2 text-[11px] text-emerald-400">📎 {media.type}</div>}
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-ink-500">Destinatários</span><span className="font-semibold">{selected.size}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Variáveis</span><span className="text-ink-300">{"{nome}"} · {"{numero}"}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Envio</span><span className="text-ink-300">{schedule ? "Agendado" : "Imediato"}</span></div>
            </div>
          </div>
        </div>

        {/* ── Histórico / monitor de campanhas (preservado) ── */}
        <div className="rounded-2xl border border-white/[0.06] p-5"
          style={{ background: "linear-gradient(160deg, #0B1120, #0F172A)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Campanhas</h3>
              <p className="text-xs text-ink-500">Acompanhe, pause ou cancele disparos em andamento</p>
            </div>
            <button onClick={loadAll} className="text-xs text-ink-300 hover:text-primary">🔄 Atualizar</button>
          </div>
          {dispatches.length === 0 ? (
            <p className="text-sm text-ink-500 text-center py-8">Nenhum disparo realizado ainda</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dispatches.slice().reverse().map((d) => {
                const total = d.total || d.recipients_count || 0;
                const sent = d.sent || 0;
                const failed = d.failed || 0;
                const pct = total ? Math.round(((sent + failed) / total) * 100) : 0;
                const delivered = sent + failed;
                const okRate = delivered ? sent / delivered : (total ? 1 : 0);
                const hScore = Math.round(okRate * 100);
                const hColor = hScore >= 85 ? "#00FF88" : hScore >= 60 ? "#F59E0B" : "#EF4444";
                const hLabel = hScore >= 85 ? "Saudável" : hScore >= 60 ? "Atenção" : "Crítico";
                const s = STATUS[d.status] || { label: d.status || "—", cls: "bg-white/5 text-ink-300 border-white/10" };
                return (
                  <button key={d.id} onClick={() => setDetailOpen(d)}
                    className="text-left rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-primary/30 hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium truncate">{d.message_title || d.messageTitle || "Campanha"}</div>
                      <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${s.cls}`}>{s.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {total > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          title={`Health score ${hScore}`}
                          style={{ background: `${hColor}1a`, color: hColor, border: `1px solid ${hColor}40` }}>
                          ◉ {hLabel} · {hScore}
                        </span>
                      )}
                      <span className="text-[11px] text-ink-500">{fmtDate(d.created_at || d.createdAt)} · {total} contatos</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#00FF88,#00D1FF)" }} />
                    </div>
                    <div className="flex gap-3 mt-1.5 text-[11px] text-ink-300">
                      <span>✅ {sent}</span><span>❌ {failed}</span>
                      <span className="ml-auto text-primary">Ver relatório →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <DispatchDetailModal dispatch={detailOpen} onClose={() => setDetailOpen(null)} onRefresh={loadAll} />
    </>
  );
}

// ── Modal de detalhe + export Excel ──────────────────────────
function DispatchDetailModal({ dispatch, onClose, onRefresh }) {
  const [filter, setFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  if (!dispatch) return null;

  const isActive = dispatch.status === "sending" || dispatch.status === "scheduled";
  const isPaused = dispatch.status === "paused";

  async function handleAction(action) {
    setActionLoading(action);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${API}/api/dispatches/${dispatch.id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(await res.text());
      onClose();
      if (onRefresh) onRefresh();
    } catch (e) {
      alert("Erro ao executar ação: " + e.message);
    } finally {
      setActionLoading(null);
    }
  }

  const items = Array.isArray(dispatch.items) ? dispatch.items : [];
  const counts = items.reduce((acc, i) => {
    const k = (i.status || "pending").toLowerCase();
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const sent = counts.sent || 0;
  const failed = counts.failed || 0;
  const pending = (counts.pending || 0) + (counts.sending || 0);

  const filtered = items.filter((i) => {
    if (filter === "all") return true;
    if (filter === "sent") return i.status === "sent";
    if (filter === "failed") return i.status === "failed";
    if (filter === "pending") return !i.status || i.status === "pending" || i.status === "sending";
    return true;
  });

  async function ensureXLSX() {
    if (typeof window !== "undefined" && window.XLSX) return window.XLSX;
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    return window.XLSX;
  }

  async function exportXLSX() {
    setExporting(true);
    try {
      const XLSX = await ensureXLSX();
      const rows = items.map((i) => ({
        Nome: i.contactName || i.name || "",
        Numero: i.contactPhone || i.phone || "",
        Status: i.status === "sent" ? "Enviado" : i.status === "failed" ? "Falhou" : "Pendente",
        EnviadoEm: i.sentAt ? new Date(i.sentAt).toLocaleString("pt-BR") : "",
        Erro: i.error || "",
      }));

      const wb = XLSX.utils.book_new();

      const summary = XLSX.utils.aoa_to_sheet([
        ["Disparo", dispatch.message_title || dispatch.messageTitle || "—"],
        ["Status",  dispatch.status || "—"],
        ["Criado em", dispatch.created_at ? new Date(dispatch.created_at).toLocaleString("pt-BR") : "—"],
        ["Total",   items.length],
        ["Enviados", sent],
        ["Falhas",   failed],
        ["Pendentes", pending],
        [],
        ["Mensagem"],
        [dispatch.message_content || dispatch.messageContent || ""],
      ]);
      summary["!cols"] = [{ wch: 18 }, { wch: 60 }];
      XLSX.utils.book_append_sheet(wb, summary, "Resumo");

      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 12 }, { wch: 22 }, { wch: 50 }];
      XLSX.utils.book_append_sheet(wb, ws, "Contatos");

      const safeTitle = (dispatch.message_title || "disparo").replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 30);
      const dateStr = new Date(dispatch.created_at || Date.now()).toISOString().slice(0, 10);
      XLSX.writeFile(wb, `relatorio_${safeTitle}_${dateStr}.xlsx`);
    } finally { setExporting(false); }
  }

  const statusBadge = (st) => {
    const map = {
      sent:    { label: "Enviado",  cls: "bg-primary/15 text-primary border-primary/30" },
      failed:  { label: "Falhou",   cls: "bg-red-500/15 text-red-300 border-red-500/30" },
      sending: { label: "Enviando", cls: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
    };
    const m = map[st] || { label: "Pendente", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" };
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${m.cls}`}>{m.label}</span>;
  };

  return (
    <Modal
      open={!!dispatch}
      onClose={onClose}
      size="lg"
      title={dispatch.message_title || dispatch.messageTitle || "Detalhe do Disparo"}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">Fechar</button>
          {isActive && (
            <button onClick={() => handleAction("pause")} disabled={actionLoading === "pause"} className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-semibold text-sm hover:opacity-90 disabled:opacity-50">
              {actionLoading === "pause" ? "Pausando..." : "⏸ Pausar"}
            </button>
          )}
          {isPaused && (
            <button onClick={() => handleAction("resume")} disabled={actionLoading === "resume"} className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold text-sm hover:opacity-90 disabled:opacity-50">
              {actionLoading === "resume" ? "Retomando..." : "▶ Retomar"}
            </button>
          )}
          {(isActive || isPaused) && (
            <button onClick={() => { if (confirm("Cancelar disparo? Os contatos pendentes não receberão a mensagem.")) handleAction("cancel"); }} disabled={actionLoading === "cancel"} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 font-semibold text-sm hover:opacity-90 disabled:opacity-50">
              {actionLoading === "cancel" ? "Cancelando..." : "✕ Cancelar"}
            </button>
          )}
          <button onClick={exportXLSX} disabled={exporting || !items.length} className="px-4 py-2 rounded-lg bg-primary text-bg font-semibold text-sm hover:opacity-90 disabled:opacity-50">
            {exporting ? "Gerando..." : "📊 Exportar Excel"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-4 gap-2 mb-5">
        <Stat label="Total" value={items.length} tone="neutral" />
        <Stat label="Enviados" value={sent} tone="success" />
        <Stat label="Falhas" value={failed} tone="danger" />
        <Stat label="Pendentes" value={pending} tone="warn" />
      </div>

      {(dispatch.message_content || dispatch.messageContent) && (
        <div className="mb-5">
          <div className="text-xs text-ink-400 uppercase tracking-wider mb-1">Mensagem enviada</div>
          <div className="rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
            {dispatch.message_content || dispatch.messageContent}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        {[
          { v: "all",     label: `Todos (${items.length})` },
          { v: "sent",    label: `✅ ${sent}` },
          { v: "failed",  label: `❌ ${failed}` },
          { v: "pending", label: `⌛ ${pending}` },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              filter === f.v ? "bg-primary/15 text-primary border-primary/30" : "bg-white/5 text-ink-300 border-white/10 hover:bg-white/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden max-h-[50vh] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.04] sticky top-0 z-10">
            <tr className="text-left text-[11px] text-ink-400 uppercase tracking-wider">
              <th className="px-3 py-2">Contato</th>
              <th className="px-3 py-2">Número</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 hidden sm:table-cell">Quando</th>
              <th className="px-3 py-2 hidden md:table-cell">Erro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-ink-500">Nenhum item nesse filtro</td></tr>
            ) : filtered.map((i, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02]">
                <td className="px-3 py-2 font-medium">{i.contactName || i.name || "—"}</td>
                <td className="px-3 py-2 text-ink-300 font-mono text-xs">{i.contactPhone || i.phone || "—"}</td>
                <td className="px-3 py-2">{statusBadge(i.status)}</td>
                <td className="px-3 py-2 text-ink-400 text-xs hidden sm:table-cell">{i.sentAt ? new Date(i.sentAt).toLocaleString("pt-BR") : "—"}</td>
                <td className="px-3 py-2 text-red-400 text-xs hidden md:table-cell max-w-xs truncate" title={i.error}>{i.error || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

function Stat({ label, value, tone = "neutral" }) {
  const tones = {
    neutral: "bg-white/[0.03] border-white/10 text-ink-100",
    success: "bg-primary/[0.08] border-primary/30 text-primary",
    danger:  "bg-red-500/[0.08] border-red-500/30 text-red-300",
    warn:    "bg-yellow-500/[0.06] border-yellow-500/25 text-yellow-300",
  };
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${tones[tone]}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70 font-semibold">{label}</div>
      <div className="text-2xl font-bold tabular-nums leading-tight mt-0.5">{value.toLocaleString("pt-BR")}</div>
    </div>
  );
}
