"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChevronLeft, ChevronRight, Send, Users, Calendar,
  ClipboardCheck, MessageSquare, Paperclip, ShieldCheck,
  Zap, Trash2, Search, X, BookmarkPlus, AlertTriangle, RefreshCw,
  Image as ImageIcon, Video, Music, FileText, Smartphone, Cloud,
  Repeat2, Megaphone, Info, Pause, Play, XCircle, FileDown,
  Layout, ArrowRight, Eye, Variable, MapPin,
} from "lucide-react";
import Topbar from "../../../components/dashboard/Topbar";
import { DashButton, DashIconButton, DashBadge, DashEmptyState, DashModal } from "../../../components/dashboard/DashUI";
import { DASH_ACCENT } from "../../../components/dashboard/dashTheme";
import { api, API_URL, getToken } from "../../../lib/api";

const ACCENT = DASH_ACCENT.amber;

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch { return "—"; }
}

const STATUS = {
  pending: { label: "Pendente", color: DASH_ACCENT.slate },
  scheduled: { label: "Agendado", color: DASH_ACCENT.amber },
  sending: { label: "Enviando...", color: DASH_ACCENT.amber },
  completed: { label: "Concluído", color: DASH_ACCENT.emerald },
  failed: { label: "Falhou", color: DASH_ACCENT.red },
  paused: { label: "Pausado", color: DASH_ACCENT.slate },
  cancelled: { label: "Cancelado", color: DASH_ACCENT.red },
};

const STEPS = [
  { n: 1, label: "Mensagem", Icon: MessageSquare },
  { n: 2, label: "Destinatários", Icon: Users },
  { n: 3, label: "Agendamento", Icon: Calendar },
  { n: 4, label: "Revisão", Icon: ClipboardCheck },
];

function LightField({ label, hint, children }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-dash-ink mb-1.5">{label}</span>}
      {children}
      {hint && <span className="block text-xs text-dash-faint mt-1.5">{hint}</span>}
    </label>
  );
}

export default function CampanhasPage() {
  const [wpp, setWpp] = useState(null);
  const [lists, setLists] = useState([]);
  const [leads, setLeads] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [detailOpen, setDetailOpen] = useState(null);
  const [usage, setUsage] = useState(null);
  const [messages, setMessages] = useState([{ id: Date.now(), text: "" }]);
  const [listSel, setListSel] = useState("");
  const [contactsMode, setContactsMode] = useState("list"); // "list" | "file" | "manual"
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
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
  const topRef = useRef(null);

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

  // SSE — atualiza contadores de dispatch em tempo real
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const es = new EventSource(`${API_URL}/api/chats/stream?token=${encodeURIComponent(token)}`);
    const onDispatchUpdate = (e) => {
      try {
        const d = JSON.parse(e.data);
        setDispatches(prev => prev.map(dp =>
          dp.id === d.id
            ? { ...dp, sent: d.sent ?? dp.sent, failed: d.failed ?? dp.failed, status: d.status ?? dp.status }
            : dp
        ));
      } catch {}
    };
    const onDispatchStatusUpdate = (e) => {
      try {
        const d = JSON.parse(e.data);
        setDispatches(prev => prev.map(dp => {
          if (dp.id !== d.dispatch_id) return dp;
          const update = {};
          if (d.field === 'delivered') update.delivered = d.delivered;
          if (d.field === 'read') update.read = d.read;
          if (d.field === 'delivery_failed') {
            update.delivery_failed = d.delivery_failed ?? dp.delivery_failed;
            if (d.failed_wamid && Array.isArray(dp.items)) {
              update.items = dp.items.map(it =>
                it.wamid === d.failed_wamid
                  ? { ...it, delivery_failed: true, delivery_error: 'delivery failed' }
                  : it
              );
            }
          }
          return { ...dp, ...update };
        }));
      } catch {}
    };
    es.addEventListener('dispatch_update', onDispatchUpdate);
    es.addEventListener('dispatch_status_update', onDispatchStatusUpdate);
    return () => es.close();
  }, []);

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

    if (channel !== "cloud") {
      if (selectedSourceSlot && !connectedSessions.some(s => s.slot === selectedSourceSlot)) {
        setErr("Selecione um número conectado para disparar");
        return;
      }
      if (!connectedSessions.length) { setErr("Conecte o WhatsApp em Conexões antes de disparar"); return; }
    }

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
  const hasCloudCfg = !!(cloudConfig?.has_token && cloudConfig?.enabled);
  const hasAnyChannel = wppConnected || hasCloudCfg;

  const msgCount = messages.filter(m => m.text.trim()).length;
  const canContinue = step === 1 ? msgCount > 0 : step === 2 ? selected.size > 0 : true;
  const firstMsgPreview = (messages.find(m => m.text.trim())?.text || "")
    .replace(/\{nome\}/gi, "Maria").replace(/\{numero\}/gi, "5511999998888");

  function next() { if (canContinue && step < 4) setStep(step + 1); }
  function back() { if (step > 1) setStep(step - 1); }

  function mediaIcon(type) {
    if (type === "image") return ImageIcon;
    if (type === "video") return Video;
    if (type === "audio") return Music;
    return FileText;
  }

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
                active ? "border-dash-green/40 bg-dash-green/10 text-dash-green"
                : done ? "border-dash-green/20 text-dash-green/80 hover:bg-dash-green/5"
                : "border-dash-border text-dash-faint"
              }`}
            >
              <span className={`size-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                done ? "bg-dash-green text-white" : active ? "bg-dash-green/20 text-dash-green" : "bg-dash-border2 text-dash-faint"
              }`}>
                {done ? <Check className="size-3" /> : s.n}
              </span>
              <span className="hidden sm:flex items-center gap-1.5"><SIcon className="size-3.5" />{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <div className={`w-6 h-px ${done ? "bg-dash-green/40" : "bg-dash-border"}`} />}
          </div>
        );
      })}
    </div>
  );

  const [activeTab, setActiveTab] = useState("whatsapp"); // "whatsapp" | "api"

  return (
    <>
      <Topbar title="Disparos" subtitle="Crie e acompanhe suas campanhas" />
      <div ref={topRef} className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16">

        {/* Tab switcher */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-dash-subtle border border-dash-border w-fit">
          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "whatsapp"
                ? "bg-white shadow-sm text-dash-ink border border-dash-border"
                : "text-dash-faint hover:text-dash-ink"
            }`}
          >
            <Smartphone className="size-4" /> WhatsApp Conectado
          </button>
          <button
            onClick={() => setActiveTab("api")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "api"
                ? "bg-white shadow-sm text-dash-green border border-dash-green/25"
                : "text-dash-faint hover:text-dash-ink"
            }`}
          >
            <Cloud className="size-4" /> API Meta (templates)
            {hasCloudCfg && <span className="size-2 rounded-full bg-dash-green inline-block" />}
          </button>
        </div>

        {activeTab === "api" && (
          <CloudTemplateCampaign cloudConfig={cloudConfig} lists={lists} leads={leads} onRefresh={loadAll} />
        )}

        {activeTab !== "api" && <>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="dash-card">
            {Stepper}

            {!isPro && (
              <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-dash-subtle border border-dash-border text-dash-ink2 mb-4">
                <Info className="size-3.5 text-dash-faint shrink-0" />
                Disparos este mês: <strong className={used >= limit ? "text-dash-red" : "text-dash-ink"}>{used}/{limit}</strong>
                {used >= limit && <Link href="/dashboard/workspace" className="ml-3 text-dash-green font-semibold">Upgrade →</Link>}
              </div>
            )}
            {!hasAnyChannel && (
              <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-4"
                style={{ background: `${DASH_ACCENT.amber}14`, border: `1px solid ${DASH_ACCENT.amber}33`, color: DASH_ACCENT.amber }}>
                <AlertTriangle className="size-4 shrink-0" />
                Nenhuma conexão ativa —{" "}
                <Link href="/dashboard/canais" className="underline font-semibold">conecte em Conexões</Link>
                {" "}ou configure a{" "}
                <Link href="/dashboard/canal-oficial" className="underline font-semibold">API Meta</Link>
              </div>
            )}
            {!wppConnected && hasCloudCfg && (
              <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl mb-4"
                style={{ background: `${DASH_ACCENT.emerald}0d`, border: `1px solid ${DASH_ACCENT.emerald}33`, color: DASH_ACCENT.emerald }}>
                <Cloud className="size-3.5 shrink-0" />
                API Meta configurada — selecione <strong>API Meta</strong> no passo 3 para disparar sem WhatsApp conectado
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
                        <label className="text-sm font-medium text-dash-ink">
                          Mensagens <span className="text-xs text-dash-faint font-normal">(cada número recebe 1 em sequência)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowTemplates(v => !v)}
                            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all
                              ${showTemplates ? "border-dash-violet/30" : "bg-dash-subtle border-dash-border text-dash-muted hover:text-dash-ink hover:border-dash-faint"}`}
                            style={showTemplates ? { background: `${DASH_ACCENT.violet}14`, color: DASH_ACCENT.violet } : undefined}
                          >
                            <Zap className="size-3.5" />
                            Mensagens Rápidas
                            {templates.length > 0 && (
                              <span className="size-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                                style={{ background: `${DASH_ACCENT.violet}22`, color: DASH_ACCENT.violet }}>
                                {templates.length}
                              </span>
                            )}
                          </button>
                          <button type="button" onClick={addMessage} className="text-xs text-dash-green hover:underline font-medium">+ Adicionar</button>
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
                            <div className="rounded-xl p-4 w-full overflow-hidden" style={{ border: `1px solid ${DASH_ACCENT.violet}33`, background: `${DASH_ACCENT.violet}0a` }}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Zap className="size-4" style={{ color: DASH_ACCENT.violet }} />
                                  <span className="text-sm font-semibold text-dash-ink">Mensagens Rápidas</span>
                                </div>
                                <button onClick={() => setShowTemplates(false)} className="text-dash-faint hover:text-dash-ink">
                                  <X className="size-4" />
                                </button>
                              </div>

                              {/* Salvar mensagem atual como template */}
                              {messages.some(m => m.text.trim()) && (
                                <div className="mb-3 p-3 rounded-lg bg-white border border-dash-border">
                                  <p className="text-xs text-dash-faint mb-2">Salvar mensagem atual como template:</p>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={templateName}
                                      onChange={e => setTemplateName(e.target.value)}
                                      placeholder="Nome do template (opcional)"
                                      className="dash-input flex-1 !py-1.5 text-xs"
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
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                                      style={{ background: `${DASH_ACCENT.violet}14`, border: `1px solid ${DASH_ACCENT.violet}33`, color: DASH_ACCENT.violet }}
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
                                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-dash-faint" />
                                  <input
                                    type="text"
                                    value={templateSearch}
                                    onChange={e => setTemplateSearch(e.target.value)}
                                    placeholder="Buscar template..."
                                    className="dash-input w-full !pl-8 !py-1.5 text-xs"
                                  />
                                </div>
                              )}

                              {/* Lista de templates */}
                              {filteredTemplates.length === 0 ? (
                                <div className="text-center py-6 text-xs text-dash-faint">
                                  {templates.length === 0
                                    ? "Nenhum template salvo ainda. Escreva uma mensagem e salve acima!"
                                    : "Nenhum template encontrado"}
                                </div>
                              ) : (
                                <div className="overflow-x-hidden w-full">
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                  {filteredTemplates.map(tpl => (
                                    <div key={tpl.id} className="group w-full flex items-start gap-2 p-3 rounded-lg border border-dash-border bg-white hover:bg-dash-subtle transition-all"
                                      style={{ borderColor: undefined }}>
                                      <div className="flex-1 min-w-0 overflow-hidden">
                                        <p className="text-xs font-semibold text-dash-ink2 mb-0.5 truncate">{tpl.name}</p>
                                        <p className="text-xs text-dash-faint line-clamp-2 break-words whitespace-pre-wrap">{tpl.text}</p>
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
                                                className="size-6 rounded text-[10px] font-bold flex items-center justify-center"
                                                style={{ background: `${DASH_ACCENT.violet}14`, border: `1px solid ${DASH_ACCENT.violet}33`, color: DASH_ACCENT.violet }}
                                              >
                                                {i + 1}
                                              </button>
                                            ))}
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => applyTemplate(tpl.text, messages[0]?.id)}
                                            className="px-2.5 py-1 rounded text-[10px] font-semibold transition-colors whitespace-nowrap"
                                            style={{ background: `${DASH_ACCENT.violet}14`, border: `1px solid ${DASH_ACCENT.violet}33`, color: DASH_ACCENT.violet }}
                                          >
                                            Usar
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => deleteTemplate(tpl.id)}
                                          className="size-6 rounded bg-dash-red/10 border border-dash-red/25 text-dash-red flex items-center justify-center hover:bg-dash-red/20 transition-colors"
                                        >
                                          <Trash2 className="size-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="space-y-3">
                        {messages.map((m, i) => (
                          <div key={m.id} className="rounded-xl border border-dash-border bg-dash-subtle p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="size-5 rounded-full bg-dash-green text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                                <span className="text-xs font-semibold text-dash-muted uppercase tracking-wide">Mensagem {i + 1}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => insertVar(m.id, "{nome}")} className="text-xs px-2 py-1 rounded bg-dash-green/10 border border-dash-green/25 text-dash-green hover:bg-dash-green/20">+ {"{nome}"}</button>
                                <button type="button" onClick={() => insertVar(m.id, "{numero}")} className="text-xs px-2 py-1 rounded bg-dash-green/10 border border-dash-green/25 text-dash-green hover:bg-dash-green/20">+ {"{numero}"}</button>
                                {messages.length > 1 && (
                                  <button type="button" onClick={() => removeMessage(m.id)} className="text-xs px-2 py-1 rounded bg-dash-red/10 border border-dash-red/25 text-dash-red hover:bg-dash-red/20">
                                    <X className="size-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <textarea
                              ref={(el) => { textareaRefs.current[m.id] = el; }}
                              value={m.text}
                              onChange={(e) => updateMessage(m.id, e.target.value)}
                              placeholder={`Digite a mensagem ${i + 1} aqui...`}
                              rows={4}
                              className="dash-input w-full resize-y"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-start gap-1.5 text-xs text-dash-faint mt-2">
                        <Info className="size-3.5 shrink-0 mt-0.5" />
                        Nº1 vai pro contato 1, Nº2 pro contato 2... evita padrão e reduz risco de banimento
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-dash-ink flex items-center gap-1.5">
                          <Paperclip className="size-4" /> Anexo <span className="text-xs text-dash-faint font-normal">(opcional)</span>
                        </label>
                        {media && <button type="button" onClick={removeMedia} className="text-xs text-dash-red hover:opacity-80 font-medium">Remover</button>}
                      </div>
                      {!media ? (
                        <label className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all cursor-pointer p-6
                          ${uploadingMedia ? "border-dash-green/40 bg-dash-green/5" : "border-dash-border hover:border-dash-faint hover:bg-dash-subtle"}`}>
                          <input type="file" className="hidden"
                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.csv,.txt"
                            onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0])}
                            disabled={uploadingMedia} />
                          {uploadingMedia ? (
                            <><span className="size-5 border-2 border-dash-green border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-dash-muted">Enviando...</span></>
                          ) : (
                            <><Paperclip className="size-6 text-dash-faint" />
                            <span className="text-xs text-dash-muted text-center">Clique ou arraste o arquivo aqui · Máx. 64 MB</span></>
                          )}
                        </label>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dash-green/25 bg-dash-green/5">
                          {(() => { const MIcon = mediaIcon(media.type); return <MIcon className="size-6 text-dash-green flex-shrink-0" />; })()}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-dash-ink truncate">{media.originalname || media.filename}</div>
                            <div className="text-xs text-dash-faint mt-0.5">{media.type} · {media.size ? (media.size / 1024 / 1024).toFixed(2) + " MB" : ""}</div>
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
                    {/* Seletor de fonte */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-dash-subtle border border-dash-border w-full mb-1">
                      {[
                        { v: "list", label: "Lista salva" },
                        { v: "file", label: "Importar arquivo" },
                        { v: "manual", label: "Adicionar manual" },
                      ].map(opt => (
                        <button key={opt.v} type="button"
                          onClick={() => { setContactsMode(opt.v); setContacts([]); setSelected(new Set()); setListSel(""); }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            contactsMode === opt.v ? "bg-white shadow-sm text-dash-ink border border-dash-border" : "text-dash-faint hover:text-dash-ink"
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Modo: lista salva */}
                    {contactsMode === "list" && (
                      <LightField label="Lista de Contatos">
                        <select value={listSel} onChange={(e) => setListSel(e.target.value)} className="dash-input">
                          <option value="">— Selecione uma lista —</option>
                          <option value="leads">Leads do sistema ({leads.length})</option>
                          {lists.map(l => (
                            <option key={l.id} value={`list:${l.id}`}>{l.name} ({l.total || l.contacts_count || 0} contatos)</option>
                          ))}
                        </select>
                      </LightField>
                    )}

                    {/* Modo: importar arquivo */}
                    {contactsMode === "file" && (
                      <ContactFileImport onContacts={(arr) => { setContacts(arr); setSelected(new Set(arr.map(c => c.phone))); }} />
                    )}

                    {/* Modo: manual */}
                    {contactsMode === "manual" && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text" value={manualName} onChange={e => setManualName(e.target.value)}
                            placeholder="Nome" className="dash-input flex-1"
                          />
                          <input
                            type="text" value={manualPhone} onChange={e => setManualPhone(e.target.value)}
                            placeholder="Número (ex: 5511999887766)" className="dash-input flex-1"
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                const phone = manualPhone.replace(/\D/g, "");
                                if (phone.length >= 10) {
                                  const c = { name: manualName.trim() || phone, phone };
                                  setContacts(prev => [...prev, c]);
                                  setSelected(prev => new Set([...prev, phone]));
                                  setManualName(""); setManualPhone("");
                                }
                              }
                            }}
                          />
                          <button type="button"
                            onClick={() => {
                              const phone = manualPhone.replace(/\D/g, "");
                              if (phone.length >= 10) {
                                const c = { name: manualName.trim() || phone, phone };
                                setContacts(prev => [...prev, c]);
                                setSelected(prev => new Set([...prev, phone]));
                                setManualName(""); setManualPhone("");
                              }
                            }}
                            className="px-3 py-2 rounded-lg bg-dash-green text-white text-sm font-medium hover:bg-dash-green/90 whitespace-nowrap">
                            + Adicionar
                          </button>
                        </div>
                        <div className="text-xs text-dash-faint">Pressione Enter ou clique + Adicionar após cada contato</div>
                      </div>
                    )}

                    {/* Lista de contatos selecionados */}
                    {contacts.length > 0 ? (
                      <div className="rounded-xl border border-dash-border p-3">
                        <div className="flex items-center gap-3 text-xs mb-2">
                          <button onClick={selectAll} className="text-dash-green font-medium">Selecionar todos</button>
                          <span className="text-dash-border">|</span>
                          <button onClick={deselectAll} className="text-dash-muted">Desmarcar todos</button>
                          {contactsMode === "manual" && (
                            <>
                              <span className="text-dash-border">|</span>
                              <button onClick={() => { setContacts([]); setSelected(new Set()); }} className="text-dash-red">Limpar</button>
                            </>
                          )}
                          <span className="ml-auto text-dash-faint">{selected.size} selecionados</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {contacts.map((c) => (
                            <label key={c.phone} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-dash-subtle cursor-pointer text-sm">
                              <input type="checkbox" checked={selected.has(c.phone)} onChange={() => toggle(c.phone)} className="accent-[#0E8A47]" />
                              <span className="flex-1 truncate text-dash-ink2">{c.name || "—"}</span>
                              <span className="text-xs text-dash-faint font-mono">{c.phone}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : (
                      contactsMode === "list" && (
                        <div className="dash-empty py-8">
                          <p className="text-sm text-dash-faint m-0">Selecione uma lista para escolher os destinatários</p>
                        </div>
                      )
                    )}
                  </>
                )}

                {/* ── STEP 3: AGENDAMENTO + ENVIO ── */}
                {step === 3 && (
                  <>
                    <LightField label="Quando enviar" hint="Deixe em branco para disparar imediatamente">
                      <input type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} className="dash-input" />
                    </LightField>

                    <div className="rounded-xl border border-dash-border bg-dash-subtle p-4 space-y-3">
                      <div className="dash-section-label !mb-0">Configurações de envio</div>
                      <div className="grid grid-cols-2 gap-3">
                        <LightField label="Velocidade de envio" hint="">
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { label: "Rápido", s: 1, hint: "~1s" },
                              { label: "Médio",  s: 3, hint: "~3s" },
                              { label: "Lento",  s: 6, hint: "~6s" },
                            ].map(({ label, s, hint }) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setDelay(s)}
                                className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg border text-xs font-semibold transition-all ${
                                  Number(delay) === s
                                    ? "border-dash-blue bg-dash-blue/8 text-dash-blue"
                                    : "border-dash-border text-dash-ink2 hover:border-dash-blue/40"
                                }`}
                              >
                                {label}
                                <span className="text-[9px] font-normal text-dash-faint">{hint}</span>
                              </button>
                            ))}
                          </div>
                        </LightField>
                        <LightField label="Pausar a cada X msgs" hint="0 = sem pausa">
                          <input type="number" min={0} max={1000} value={pauseEvery} onChange={(e) => setPauseEvery(e.target.value)} className="dash-input" />
                        </LightField>
                      </div>
                      {parseInt(pauseEvery) > 0 && (
                        <LightField label="Duração da pausa (minutos)">
                          <input type="number" min={1} max={60} value={pauseDuration} onChange={(e) => setPauseDuration(e.target.value)} className="dash-input" />
                        </LightField>
                      )}
                    </div>

                    {(() => {
                      const connectedSessions = sessions.filter(s => s.status === "connected");
                      const hasAny = connectedSessions.length > 0;
                      const hasTwo = connectedSessions.length >= 2;
                      const selectedSource = sourceSessionSlot ? connectedSessions.find(s => String(s.slot) === sourceSessionSlot) : null;
                      return (
                        <div className="rounded-xl border border-dash-border bg-dash-subtle p-4 space-y-3">
                          <div className="dash-section-label !mb-0">Conexões de saída</div>
                          {!hasAny ? (
                            <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
                              style={{ background: `${DASH_ACCENT.amber}14`, border: `1px solid ${DASH_ACCENT.amber}33`, color: DASH_ACCENT.amber }}>
                              <AlertTriangle className="size-4 shrink-0" />
                              Nenhum número conectado — <Link href="/dashboard/canais" className="underline font-semibold">conectar agora</Link>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {connectedSessions.map(s => (
                                <div key={s.slot} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dash-green/10 border border-dash-green/25 text-sm">
                                  <span className="size-2 rounded-full bg-dash-green" />
                                  <span className="font-medium text-dash-green">Número {s.slot}</span>
                                  {s.phone && <span className="text-dash-faint text-xs">+{s.phone}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                          {hasAny && (
                            <LightField label="Número de disparo"
                              hint={selectedSource ? `Sai pelo Número ${selectedSource.slot}${selectedSource.phone ? ` (+${selectedSource.phone})` : ""}.` : "Automático usa o primeiro; 2 Chips alterna entre os dois."}>
                              <select value={sourceSessionSlot}
                                onChange={(e) => { setSourceSessionSlot(e.target.value); if (e.target.value) setDualChip(false); }}
                                disabled={channel === "cloud"}
                                className="dash-input disabled:opacity-50">
                                <option value="">Automático</option>
                                {connectedSessions.map(s => (
                                  <option key={s.slot} value={s.slot}>Número {s.slot}{s.phone ? ` (+${s.phone})` : ""}</option>
                                ))}
                              </select>
                            </LightField>
                          )}
                          <div>
                            <div className="text-xs font-semibold text-dash-muted mb-2 uppercase tracking-wide">Canal de envio</div>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { value: "auto", Icon: Zap, label: "Automático", desc: "Canal disponível" },
                                { value: "baileys", Icon: Smartphone, label: "WhatsApp", desc: "Número conectado" },
                                { value: "cloud", Icon: Cloud, label: "API Meta", desc: "Business API" },
                              ].map(opt => {
                                const disabled = opt.value === "cloud" && !hasCloudCfg;
                                const active = channel === opt.value;
                                const OptIcon = opt.Icon;
                                return (
                                  <button key={opt.value} type="button" disabled={disabled}
                                    onClick={() => { if (disabled) return; setChannel(opt.value); if (opt.value === "cloud") { setSourceSessionSlot(""); setDualChip(false); } }}
                                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-center transition-all
                                      ${disabled ? "opacity-40 cursor-not-allowed border-dash-border bg-white" :
                                        active ? "border-dash-green/50 bg-dash-green/10 text-dash-green" :
                                        "border-dash-border bg-white hover:border-dash-faint text-dash-muted"}`}>
                                    <OptIcon className="size-4" />
                                    <span className="text-xs font-semibold">{opt.label}</span>
                                    <span className="text-[10px] text-dash-faint">{disabled ? "Não configurado" : opt.desc}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div
                            onClick={() => { if (!hasTwo) return; setDualChip(v => { const n = !v; if (n) setSourceSessionSlot(""); return n; }); }}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer select-none
                              ${!hasTwo ? "opacity-40 cursor-not-allowed border-dash-border bg-white" :
                                dualChip ? "border-dash-green/40 bg-dash-green/8" : "border-dash-border bg-white hover:border-dash-faint"}`}>
                            <div className="flex items-center gap-3">
                              <Repeat2 className="size-5 text-dash-muted" />
                              <div>
                                <div className="text-sm font-semibold flex items-center gap-2 text-dash-ink">
                                  Modo 2 Chips
                                  {!hasTwo && <span className="text-xs font-normal text-dash-faint bg-dash-subtle border border-dash-border px-2 py-0.5 rounded-full">Requer 2 números</span>}
                                </div>
                                <div className="text-xs text-dash-faint mt-0.5">Alterna entre os 2 números — reduz risco de banimento</div>
                              </div>
                            </div>
                            <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${dualChip && hasTwo ? "bg-dash-green" : "bg-dash-border"}`}>
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
                    <div className="text-sm font-semibold mb-1 text-dash-ink">Resumo da campanha</div>
                    {[
                      ["Mensagens", `${msgCount} variação(ões)`],
                      ["Destinatários", `${selected.size} contato(s)`],
                      ["Lista", listSel === "leads" ? "Leads do sistema" : (lists.find(l => `list:${l.id}` === listSel)?.name || "—")],
                      ["Quando", schedule ? new Date(schedule).toLocaleString("pt-BR") : "Agora"],
                      ["Canal", channel === "cloud" ? "API Meta" : channel === "baileys" ? "WhatsApp" : "Automático"],
                      ["Modo", dualChip ? "2 Chips (alternância)" : sourceSessionSlot ? `Número ${sourceSessionSlot}` : "Automático"],
                      ["Velocidade / Pausa", `${Number(delay) === 1 ? "Rápido" : Number(delay) === 6 ? "Lento" : "Médio"} · pausa a cada ${pauseEvery || 0}`],
                      ["Anexo", media ? (media.originalname || media.filename) : "Nenhum"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-3 text-sm border-b border-dash-border2 pb-2">
                        <span className="text-dash-faint">{k}</span>
                        <span className="text-dash-ink font-medium text-right">{v}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-xs text-dash-muted mt-3 px-3 py-2.5 rounded-xl border border-dash-green/20 bg-dash-green/[0.04]">
                      <ShieldCheck className="size-4 text-dash-green shrink-0" />
                      Envio em conformidade com as políticas do WhatsApp. Respeite consentimento dos contatos.
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {err && <div className="text-sm text-dash-red bg-dash-red/10 border border-dash-red/25 rounded-xl px-4 py-3 mt-4">{err}</div>}
            {ok && <div className="text-sm text-dash-green bg-dash-green/10 border border-dash-green/25 rounded-xl px-4 py-3 mt-4">{ok}</div>}

            <div className="flex items-center justify-between gap-2 mt-6 pt-4 border-t border-dash-border2">
              <DashButton variant="ghost" onClick={back} disabled={step === 1} className="!py-2.5">
                <ChevronLeft className="size-4" /> Voltar
              </DashButton>
              {step < 4 ? (
                <DashButton onClick={next} disabled={!canContinue} className="!py-2.5">
                  Continuar <ChevronRight className="size-4" />
                </DashButton>
              ) : (
                <DashButton onClick={sendDispatch} loading={sending} className="!py-2.5 flex-1 sm:flex-none">
                  <Send className="size-4" /> Confirmar e enviar
                </DashButton>
              )}
            </div>
          </div>

          {/* Pré-visualização */}
          <div className="dash-card lg:sticky lg:top-4">
            <div className="text-sm font-semibold mb-3 text-dash-ink">Pré-visualização</div>
            <div className="rounded-2xl border border-dash-border bg-[#0b141a] p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-7 rounded-full" style={{ background: `linear-gradient(135deg, ${DASH_ACCENT.amber}, ${DASH_ACCENT.emerald})` }} />
                <div className="text-xs">
                  <div className="font-semibold text-white">Seu Número</div>
                  <div className="text-[10px] text-emerald-400">online</div>
                </div>
              </div>
              <div className="bg-[#202c33] rounded-xl rounded-tl-sm px-3 py-2 text-[13px] text-[#e9edef] whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                {firstMsgPreview || <span className="text-white/40 italic">Sua mensagem aparece aqui…</span>}
                {media && <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1"><Paperclip className="size-3" /> {media.type}</div>}
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-dash-faint">Destinatários</span><span className="font-semibold text-dash-ink">{selected.size}</span></div>
              <div className="flex justify-between"><span className="text-dash-faint">Variáveis</span><span className="text-dash-muted">{"{nome}"} · {"{numero}"}</span></div>
              <div className="flex justify-between"><span className="text-dash-faint">Envio</span><span className="text-dash-muted">{schedule ? "Agendado" : "Imediato"}</span></div>
            </div>
          </div>
        </div>

        </>}

        {/* ── Histórico / monitor de campanhas — sempre visível em ambas as abas ── */}
        {(() => {
          const tabDispatches = activeTab === "api"
            ? dispatches.filter(d => d.channel === "cloud_template")
            : dispatches.filter(d => d.channel !== "cloud_template");
          return (
            <div className="dash-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-dash-ink m-0">Campanhas</h3>
                  <p className="text-xs text-dash-faint m-0">Acompanhe, pause ou cancele disparos em andamento</p>
                </div>
                <DashIconButton onClick={loadAll} title="Atualizar"><RefreshCw className="size-3.5" /></DashIconButton>
              </div>
              {tabDispatches.length === 0 ? (
                <DashEmptyState
                  icon={Megaphone}
                  accent={ACCENT}
                  title="Nenhuma campanha ainda"
                  desc="Configure sua mensagem e destinatários acima para criar o primeiro disparo."
                  cta={activeTab !== "api" ? { label: "Nova campanha", icon: Send, onClick: () => { setStep(1); topRef.current?.scrollIntoView({ behavior: "smooth" }); } } : undefined}
                />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tabDispatches.slice().reverse().map((d) => {
                    const total = d.total || d.recipients_count || 0;
                    const sent = d.sent || 0;
                    const failed = d.failed || 0;
                    const delivFailed = d.delivery_failed || 0;
                    const processed = sent + failed;
                    const pct = total ? Math.round((processed / total) * 100) : 0;
                    const okRate = processed ? (sent - delivFailed) / processed : (total ? 1 : 0);
                    const hScore = Math.max(0, Math.round(okRate * 100));
                    const hColor = hScore >= 85 ? DASH_ACCENT.emerald : hScore >= 60 ? DASH_ACCENT.amber : DASH_ACCENT.red;
                    const hLabel = hScore >= 85 ? "Saudável" : hScore >= 60 ? "Atenção" : "Crítico";
                    const s = STATUS[d.status] || { label: d.status || "—", color: DASH_ACCENT.slate };
                    const barColor = d.status === "failed" ? DASH_ACCENT.red : d.status === "completed" ? DASH_ACCENT.green : DASH_ACCENT.amber;
                    return (
                      <button key={d.id} onClick={() => setDetailOpen(d)}
                        className="text-left rounded-2xl border border-dash-border bg-white p-4 hover:border-dash-amber/40 hover:bg-dash-subtle transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-medium truncate text-dash-ink">{d.message_title || d.messageTitle || "Campanha"}</div>
                          <DashBadge color={s.color} dot={false} className="shrink-0">{s.label}</DashBadge>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          {total > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                              title={`Health score ${hScore}`}
                              style={{ background: `${hColor}1a`, color: hColor, border: `1px solid ${hColor}40` }}>
                              {hLabel} · {hScore}
                            </span>
                          )}
                          <span className="text-[11px] text-dash-faint">{fmtDate(d.created_at || d.createdAt)} · {total} contatos</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-[#F1F3F6] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                        <div className="flex gap-3 mt-1.5 text-[11px] text-dash-muted">
                          <span style={{ color: DASH_ACCENT.emerald }}>{sent} enviados</span>
                          {failed > 0 && <span style={{ color: DASH_ACCENT.red }}>{failed} falha API</span>}
                          {delivFailed > 0 && <span style={{ color: DASH_ACCENT.amber }}>⚠ {delivFailed} não entregue</span>}
                          <span className="ml-auto text-dash-green font-medium">Ver relatório →</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

      </div>

      <DispatchDetailModal dispatch={detailOpen} onClose={() => setDetailOpen(null)} onRefresh={loadAll} />
    </>
  );
}

// ── Importação de contatos via arquivo (CSV/XLSX) ────────────
function ContactFileImport({ onContacts }) {
  const [info, setInfo] = useState("");
  const [err, setErr] = useState("");
  const [stats, setStats] = useState(null);
  const fileRef = useRef(null);

  async function readFile(file) {
    if (!file) return;
    setErr(""); setInfo("Lendo arquivo..."); setStats(null);
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      let parsed = [];
      if (ext === "csv") {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (!lines.length) throw new Error("Arquivo vazio");
        const sep = lines[0].includes(";") ? ";" : ",";
        const headers = lines[0].split(sep).map(h => h.trim().replace(/"/g, "").toUpperCase());
        const ni = headers.findIndex(h => h.includes("NOME") || h.includes("NAME"));
        const pi = headers.findIndex(h => h.includes("NUMERO") || h.includes("NUMBER") || h.includes("TELEFONE") || h.includes("PHONE"));
        if (pi === -1) throw new Error("Coluna NUMERO/TELEFONE não encontrada");
        parsed = lines.slice(1).map(l => {
          const c = l.split(sep).map(x => x.trim().replace(/"/g, ""));
          const phone = (c[pi] || "").replace(/\D/g, "");
          return { name: ni >= 0 ? (c[ni] || "") : "", phone };
        }).filter(r => r.phone.length >= 10);
      } else {
        if (!window.XLSX) {
          await new Promise((res, rej) => {
            const s = document.createElement("script");
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
            s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
          });
        }
        const buf = await file.arrayBuffer();
        const wb = window.XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = window.XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (!raw.length) throw new Error("Planilha vazia");
        const headers = raw[0].map(h => String(h || "").trim().toUpperCase());
        const ni = headers.findIndex(h => h.includes("NOME") || h.includes("NAME"));
        const pi = headers.findIndex(h => h.includes("NUMERO") || h.includes("NUMBER") || h.includes("TELEFONE") || h.includes("PHONE"));
        if (pi === -1) throw new Error("Coluna NUMERO/TELEFONE não encontrada");
        parsed = raw.slice(1).filter(r => r[pi]).map(r => ({
          name: ni >= 0 ? String(r[ni] || "").trim() : "",
          phone: String(r[pi] || "").replace(/\D/g, ""),
        })).filter(r => r.phone.length >= 10);
      }
      const seen = new Set();
      const valid = parsed.filter(r => { if (seen.has(r.phone)) return false; seen.add(r.phone); return true; });
      if (!valid.length) throw new Error("Nenhum contato válido. Verifique se os números têm DDD (11 dígitos com 55).");
      setStats({ total: parsed.length, valid: valid.length, dupes: parsed.length - valid.length });
      setInfo("");
      onContacts(valid.map(r => ({ name: r.name || r.phone, phone: r.phone })));
    } catch (e) {
      setErr(e.message); setInfo(""); setStats(null);
    }
  }

  return (
    <div className="space-y-3">
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); readFile(e.dataTransfer.files?.[0]); }}
        className="rounded-xl border-2 border-dashed border-dash-border hover:border-dash-green/40 hover:bg-dash-green/[0.02] transition-all p-6 text-center cursor-pointer"
      >
        <FileText className="size-7 text-dash-faint mx-auto mb-2" />
        <div className="text-sm font-medium text-dash-ink">Clique ou arraste o arquivo</div>
        <div className="text-xs text-dash-faint mt-1">Excel (.xlsx) ou CSV (.csv)</div>
        <div className="text-xs text-dash-faint">Coluna obrigatória: <strong>NUMERO</strong> · Opcional: <strong>NOME</strong></div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
          onChange={e => readFile(e.target.files?.[0])} />
      </div>
      {info && <div className="text-xs text-dash-faint">{info}</div>}
      {err && <div className="text-sm text-dash-red bg-dash-red/10 border border-dash-red/25 rounded-xl px-3 py-2">{err}</div>}
      {stats && (
        <div className="flex items-center gap-3 text-xs px-3 py-2 rounded-xl bg-dash-green/5 border border-dash-green/25">
          <Check className="size-3.5 text-dash-green shrink-0" />
          <span className="text-dash-green font-medium">{stats.valid} contatos importados</span>
          {stats.dupes > 0 && <span className="text-dash-faint">· {stats.dupes} duplicados removidos</span>}
        </div>
      )}
    </div>
  );
}

// ── Extrai variáveis {{N}} do corpo/header do template ──────
function extractVars(components = []) {
  const vars = new Set();
  for (const comp of components) {
    const text = comp.text || "";
    const matches = text.match(/\{\{(\d+)\}\}/g) || [];
    for (const m of matches) vars.add(parseInt(m.replace(/\{\{|\}\}/g, "")));
  }
  return [...vars].sort((a, b) => a - b);
}

// ── Disparo via API Meta (templates aprovados) ──────────────
function CloudTemplateCampaign({ cloudConfig, lists, leads, onRefresh }) {
  const [step, setStep] = useState(1);
  const [metaTemplates, setMetaTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [listSel, setListSel] = useState("");
  const [contactsMode2, setContactsMode2] = useState("list");
  const [contacts, setContacts] = useState([]);
  const [manualName2, setManualName2] = useState("");
  const [manualPhone2, setManualPhone2] = useState("");
  const [varMap, setVarMap] = useState({});
  const [headerMediaUrl, setHeaderMediaUrl] = useState("");
  const [schedule, setSchedule] = useState("");
  const [delayMs, setDelayMs] = useState(1200);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const hasCloudCfg = !!(cloudConfig?.has_token && cloudConfig?.enabled);

  useEffect(() => {
    if (!hasCloudCfg) return;
    setLoadingTemplates(true);
    api("/api/wpp-cloud/templates")
      .then(data => setMetaTemplates((data || []).filter(t => t.status === "APPROVED")))
      .catch(() => {})
      .finally(() => setLoadingTemplates(false));
  }, [hasCloudCfg]);

  // Auto-popula URL do header quando o template tem exemplo de mídia
  useEffect(() => {
    if (!selectedTemplate) return;
    const hdr = (selectedTemplate.components || []).find(c => c.type === "HEADER");
    if (hdr && ["IMAGE", "VIDEO", "DOCUMENT"].includes(hdr.format)) {
      const exampleUrl = hdr.example?.header_url?.[0] || "";
      if (exampleUrl) setHeaderMediaUrl(exampleUrl);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    (async () => {
      if (!listSel) { setContacts([]); return; }
      if (listSel === "leads") {
        setContacts(leads.map(l => ({ phone: l.phone, name: l.name })));
      } else if (listSel.startsWith("list:")) {
        try {
          const list = await api(`/api/lists/${listSel.replace("list:", "")}`);
          setContacts((list.contacts || []).map(c => ({
            phone: c.NUMERO || c.numero || c.phone || "",
            name: c.NOME || c.nome || c.name || "",
            ...c,
          })));
        } catch { setContacts([]); }
      }
    })();
  }, [listSel, leads]);

  // Colunas disponíveis no primeiro contato da lista
  const availableColumns = contacts.length > 0
    ? Object.keys(contacts[0]).filter(k => k !== "__rowNum__")
    : ["phone", "name"];

  // Variáveis necessárias pelo template selecionado
  const tplComponents = selectedTemplate?.components || [];
  const bodyComp = tplComponents.find(c => c.type === "BODY");
  const headerComp = tplComponents.find(c => c.type === "HEADER");
  // Header de mídia (IMAGE, VIDEO, DOCUMENT) exige URL ao enviar
  const headerMediaType = headerComp?.format; // "IMAGE" | "VIDEO" | "DOCUMENT" | "TEXT" | undefined
  const needsHeaderMedia = headerMediaType === "IMAGE" || headerMediaType === "VIDEO" || headerMediaType === "DOCUMENT";
  // Detecta qualquer {{variavel}} — tanto numéricas ({{1}}) quanto nomeadas ({{customer_name}})
  const bodyVarMatches = [...(bodyComp?.text || "").matchAll(/\{\{([^}]+)\}\}/g)];
  const varKeys = [...new Set(bodyVarMatches.map(m => m[1].trim()))]; // únicos, na ordem

  function resolveVar(contact, col) {
    if (!col) return "";
    return String(contact[col] || contact[col?.toLowerCase()] || "");
  }

  function buildVarsForContact(contact) {
    return varKeys.map(k => resolveVar(contact, varMap[k] || ""));
  }

  const sampleContact = contacts[0];
  const sampleVars = sampleContact ? buildVarsForContact(sampleContact) : [];
  const previewBody = bodyComp?.text
    ? varKeys.reduce((t, k, idx) => t.replace(`{{${k}}}`, sampleVars[idx] || `{{${k}}}`), bodyComp.text)
    : "";

  async function sendCampaign() {
    setErr(""); setOk("");
    if (!selectedTemplate) { setErr("Selecione um template"); return; }
    if (!contacts.length) { setErr("Selecione uma lista com contatos"); return; }

    const payload = contacts.map(c => ({
      phone: c.phone,
      name: c.name || "",
      vars: buildVarsForContact(c),
    })).filter(c => c.phone);

    if (!payload.length) { setErr("Nenhum contato com número de telefone válido"); return; }

    setSending(true);
    try {
      await api("/api/wpp-cloud/bulk-template", {
        method: "POST",
        body: {
          template_name: selectedTemplate.name,
          template_language: selectedTemplate.language,
          var_names: varKeys,
          header_media_url: needsHeaderMedia ? headerMediaUrl : undefined,
          header_media_type: needsHeaderMedia ? headerMediaType.toLowerCase() : undefined,
          contacts: payload,
          delay_ms: parseInt(delayMs) || 1200,
          scheduled_at: schedule ? new Date(schedule).toISOString() : undefined,
        },
      });
      setOk(`${schedule ? "Agendado!" : "Disparo iniciado!"} ${payload.length} contato(s) via API Meta.`);
      setStep(1);
      setSelectedTemplate(null);
      setListSel("");
      setContacts([]);
      setVarMap({});
      setHeaderMediaUrl("");
      setSchedule("");
      if (onRefresh) onRefresh();
    } catch (e) {
      setErr(e.message || "Erro ao iniciar disparo");
    } finally {
      setSending(false);
    }
  }

  const STEPS_API = [
    { n: 1, label: "Template", Icon: Layout },
    { n: 2, label: "Contatos", Icon: Users },
    { n: 3, label: "Variáveis", Icon: Variable },
    { n: 4, label: "Revisão", Icon: ClipboardCheck },
  ];

  const canNext = step === 1 ? !!selectedTemplate
    : step === 2 ? contacts.length > 0
    : step === 3 ? varKeys.every(k => varMap[k])
    : true;

  if (!hasCloudCfg) {
    return (
      <div className="dash-card flex flex-col items-center py-12 gap-4 text-center">
        <Cloud className="size-10 text-dash-faint" />
        <div className="text-dash-ink font-semibold">API Meta não configurada</div>
        <p className="text-sm text-dash-faint max-w-xs">Configure suas credenciais Meta (token, Phone Number ID, WABA ID) no Canal Oficial para usar este recurso.</p>
        <a href="/dashboard/canal-oficial" className="text-sm text-dash-green underline font-medium">Ir para Canal Oficial →</a>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div className="dash-card">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {STEPS_API.map((s, i) => {
            const done = step > s.n;
            const active = step === s.n;
            const SIcon = s.Icon;
            return (
              <div key={s.n} className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => s.n < step && setStep(s.n)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm transition-all ${
                    active ? "border-dash-green/40 bg-dash-green/10 text-dash-green"
                    : done ? "border-dash-green/20 text-dash-green/80 hover:bg-dash-green/5"
                    : "border-dash-border text-dash-faint"
                  }`}
                >
                  <span className={`size-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    done ? "bg-dash-green text-white" : active ? "bg-dash-green/20 text-dash-green" : "bg-dash-border2 text-dash-faint"
                  }`}>
                    {done ? <Check className="size-3" /> : s.n}
                  </span>
                  <span className="hidden sm:flex items-center gap-1.5"><SIcon className="size-3.5" />{s.label}</span>
                </button>
                {i < STEPS_API.length - 1 && <div className={`w-6 h-px ${done ? "bg-dash-green/40" : "bg-dash-border"}`} />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Selecionar template */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-sm font-medium text-dash-ink mb-1">Templates aprovados pela Meta</div>
            {loadingTemplates ? (
              <div className="flex items-center gap-2 text-sm text-dash-faint py-8 justify-center">
                <span className="size-4 border-2 border-dash-green border-t-transparent rounded-full animate-spin" />
                Carregando templates...
              </div>
            ) : metaTemplates.length === 0 ? (
              <div className="rounded-xl border border-dash-border p-6 text-center space-y-2">
                <Layout className="size-8 text-dash-faint mx-auto" />
                <div className="text-sm text-dash-faint">Nenhum template aprovado encontrado.</div>
                <a href="/dashboard/canal-oficial" className="text-xs text-dash-green underline">Criar template no Canal Oficial →</a>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {metaTemplates.map(tpl => {
                  const body = tpl.components?.find(c => c.type === "BODY");
                  const header = tpl.components?.find(c => c.type === "HEADER");
                  const buttons = tpl.components?.find(c => c.type === "BUTTONS");
                  const varCount = (body?.text?.match(/\{\{\d+\}\}/g) || []).length;
                  const isActive = selectedTemplate?.id === tpl.id;
                  return (
                    <button key={tpl.id} type="button" onClick={() => {
                      setSelectedTemplate(tpl);
                      setVarMap({});
                      // Pre-fill header media URL from template example if available
                      const hdr = tpl.components?.find(c => c.type === "HEADER");
                      const exUrl = hdr?.example?.header_url?.[0] || hdr?.example?.header_handle?.[0] || "";
                      setHeaderMediaUrl(exUrl);
                    }}
                      className={`w-full text-left rounded-xl border p-4 transition-all ${
                        isActive ? "border-dash-green/50 bg-dash-green/5" : "border-dash-border bg-white hover:border-dash-faint"
                      }`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-dash-ink">{tpl.name}</span>
                        <div className="flex items-center gap-1.5">
                          {varCount > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: `${DASH_ACCENT.violet}14`, color: DASH_ACCENT.violet, border: `1px solid ${DASH_ACCENT.violet}33` }}>
                              {varCount} variável{varCount > 1 ? "is" : ""}
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-dash-green/10 border border-dash-green/30 text-dash-green font-semibold">APROVADO</span>
                          {isActive && <Check className="size-4 text-dash-green" />}
                        </div>
                      </div>
                      {header?.text && <div className="text-xs font-semibold text-dash-ink2 mb-1">{header.text}</div>}
                      {body?.text && <div className="text-xs text-dash-muted line-clamp-2 whitespace-pre-wrap">{body.text}</div>}
                      {buttons?.buttons?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {buttons.buttons.map((b, bi) => (
                            <span key={bi} className="text-[10px] px-2 py-0.5 rounded border border-dash-border text-dash-faint">{b.text}</span>
                          ))}
                        </div>
                      )}
                      <div className="text-[10px] text-dash-faint mt-1">{tpl.category} · {tpl.language}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Selecionar lista */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-sm font-medium text-dash-ink">Contatos</div>

            {/* Seletor de fonte */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-dash-subtle border border-dash-border w-full">
              {[
                { v: "list", label: "Lista salva" },
                { v: "file", label: "Importar arquivo" },
                { v: "manual", label: "Adicionar manual" },
              ].map(opt => (
                <button key={opt.v} type="button"
                  onClick={() => { setContactsMode2(opt.v); setContacts([]); setListSel(""); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    contactsMode2 === opt.v ? "bg-white shadow-sm text-dash-ink border border-dash-border" : "text-dash-faint hover:text-dash-ink"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>

            {contactsMode2 === "list" && (
              <select value={listSel} onChange={e => setListSel(e.target.value)} className="dash-input w-full">
                <option value="">— Selecione —</option>
                <option value="leads">Leads do sistema ({leads.length})</option>
                {lists.map(l => (
                  <option key={l.id} value={`list:${l.id}`}>{l.name} ({l.total || l.contacts_count || 0} contatos)</option>
                ))}
              </select>
            )}

            {contactsMode2 === "file" && (
              <ContactFileImport onContacts={(arr) => setContacts(arr)} />
            )}

            {contactsMode2 === "manual" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input type="text" value={manualName2} onChange={e => setManualName2(e.target.value)}
                    placeholder="Nome" className="dash-input flex-1" />
                  <input type="text" value={manualPhone2} onChange={e => setManualPhone2(e.target.value)}
                    placeholder="5511999887766" className="dash-input flex-1"
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        const phone = manualPhone2.replace(/\D/g, "");
                        if (phone.length >= 10) {
                          setContacts(prev => [...prev, { name: manualName2.trim() || phone, phone, [manualName2.trim() || "nome"]: manualName2.trim() || phone }]);
                          setManualName2(""); setManualPhone2("");
                        }
                      }
                    }} />
                  <button type="button"
                    onClick={() => {
                      const phone = manualPhone2.replace(/\D/g, "");
                      if (phone.length >= 10) {
                        setContacts(prev => [...prev, { name: manualName2.trim() || phone, phone, [manualName2.trim() || "nome"]: manualName2.trim() || phone }]);
                        setManualName2(""); setManualPhone2("");
                      }
                    }}
                    className="px-3 py-2 rounded-lg bg-dash-green text-white text-sm font-medium hover:bg-dash-green/90">
                    + Add
                  </button>
                </div>
                <div className="text-xs text-dash-faint">Enter para adicionar</div>
              </div>
            )}

            {contacts.length > 0 && (
              <div className="rounded-xl border border-dash-border overflow-hidden">
                <div className="px-3 py-2 bg-dash-subtle border-b border-dash-border text-xs text-dash-faint flex items-center justify-between">
                  <span>{contacts.length} contatos · colunas: {availableColumns.slice(0, 4).join(", ")}{availableColumns.length > 4 ? "..." : ""}</span>
                  {contactsMode2 === "manual" && (
                    <button onClick={() => setContacts([])} className="text-dash-red text-xs">Limpar</button>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-dash-border2">
                  {contacts.slice(0, 5).map((c, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <span className="text-dash-faint w-4 text-xs">{i + 1}</span>
                      <span className="font-medium text-dash-ink">{c.name || "—"}</span>
                      <span className="text-dash-faint font-mono text-xs ml-auto">{c.phone}</span>
                    </div>
                  ))}
                  {contacts.length > 5 && (
                    <div className="px-3 py-2 text-xs text-dash-faint text-center">+ {contacts.length - 5} outros contatos</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-start gap-1.5 text-xs text-dash-faint">
              <Info className="size-3.5 shrink-0 mt-0.5" />
              Número no formato internacional: 5511999887766 (código país + DDD + número)
            </div>
          </div>
        )}

        {/* Step 3: Mapear variáveis */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-sm font-medium text-dash-ink">Mapear variáveis do template</div>
            {varKeys.length === 0 ? (
              <div className="rounded-xl border border-dash-green/25 bg-dash-green/5 px-4 py-3 text-sm text-dash-green">
                Este template não tem variáveis no corpo — será enviado igual para todos.
              </div>
            ) : (
              <div className="space-y-3">
                {varKeys.map(k => (
                  <div key={k} className="rounded-xl border border-dash-border p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${DASH_ACCENT.violet}14`, color: DASH_ACCENT.violet, border: `1px solid ${DASH_ACCENT.violet}33` }}>
                        {`{{${k}}}`}
                      </span>
                      <span className="text-xs text-dash-faint">
                        qual coluna da sua lista usar aqui?
                      </span>
                    </div>
                    <select
                      value={varMap[k] || ""}
                      onChange={e => setVarMap(m => ({ ...m, [k]: e.target.value }))}
                      className="dash-input w-full"
                    >
                      <option value="">— Selecione a coluna —</option>
                      {availableColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    {varMap[k] && sampleContact && (
                      <div className="text-xs text-dash-faint">
                        Exemplo (1º contato): <strong className="text-dash-ink">{resolveVar(sampleContact, varMap[k])}</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Revisão + envio */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-dash-ink mb-1">Revisar disparo</div>
            {[
              ["Template", selectedTemplate?.name],
              ["Idioma", selectedTemplate?.language],
              ["Categoria", selectedTemplate?.category],
              ["Contatos", `${contacts.length}`],
              ["Lista", listSel === "leads" ? "Leads do sistema" : lists.find(l => `list:${l.id}` === listSel)?.name || "—"],
              ["Quando", schedule ? new Date(schedule).toLocaleString("pt-BR") : "Imediatamente"],
              ["Velocidade", Number(delayMs) === 800 ? "Rápido (800ms)" : Number(delayMs) === 2000 ? "Lento (2s)" : "Médio (1,2s)"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 text-sm border-b border-dash-border2 pb-2">
                <span className="text-dash-faint">{k}</span>
                <span className="text-dash-ink font-medium text-right font-mono text-xs">{v}</span>
              </div>
            ))}

            {varKeys.length > 0 && (
              <div className="rounded-xl border border-dash-border p-3 space-y-1">
                <div className="text-xs font-semibold text-dash-muted uppercase tracking-wide mb-2">Mapeamento de variáveis</div>
                {varKeys.map(k => (
                  <div key={k} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-dash-violet">{`{{${k}}}`}</span>
                    <ArrowRight className="size-3 text-dash-faint" />
                    <span className="text-dash-ink font-medium">{varMap[k] || "—"}</span>
                  </div>
                ))}
              </div>
            )}

            {needsHeaderMedia && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-dash-ink">
                  URL da imagem do header{" "}
                  <span className="text-dash-red text-xs font-normal">* obrigatório</span>
                </label>
                <input
                  type="url"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={headerMediaUrl}
                  onChange={e => setHeaderMediaUrl(e.target.value)}
                  className="dash-input w-full"
                />
                <p className="text-xs text-dash-faint">
                  Este template tem um {headerMediaType?.toLowerCase()} no header. A Meta exige a URL pública da mídia ao enviar.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-medium text-dash-ink">Agendamento <span className="text-dash-faint font-normal text-xs">(opcional)</span></label>
              <input type="datetime-local" value={schedule} onChange={e => setSchedule(e.target.value)} className="dash-input w-full" />
              <label className="block text-sm font-medium text-dash-ink">Velocidade de envio</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Rápido", ms: 800,  hint: "800ms · ~75/min" },
                  { label: "Médio",  ms: 1200, hint: "1,2s · ~50/min" },
                  { label: "Lento",  ms: 2000, hint: "2s · ~30/min" },
                ].map(({ label, ms, hint }) => (
                  <button
                    key={ms}
                    type="button"
                    onClick={() => setDelayMs(ms)}
                    className={`flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      Number(delayMs) === ms
                        ? "border-dash-blue bg-dash-blue/8 text-dash-blue"
                        : "border-dash-border text-dash-ink2 hover:border-dash-blue/40"
                    }`}
                  >
                    {label}
                    <span className="text-[10px] font-normal text-dash-faint">{hint}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-start gap-1.5 text-xs text-dash-faint">
                <Info className="size-3.5 shrink-0 mt-0.5" />
                Rápido requer tier ≥ 1K/dia. Para contas novas, use Médio ou Lento.
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl border border-dash-green/20 bg-dash-green/[0.04]">
              <ShieldCheck className="size-4 text-dash-green shrink-0" />
              Templates aprovados pela Meta garantem entrega fora da janela 24h.
            </div>
          </div>
        )}

        {err && <div className="text-sm text-dash-red bg-dash-red/10 border border-dash-red/25 rounded-xl px-4 py-3 mt-4">{err}</div>}
        {ok && <div className="text-sm text-dash-green bg-dash-green/10 border border-dash-green/25 rounded-xl px-4 py-3 mt-4">{ok}</div>}

        <div className="flex items-center justify-between gap-2 mt-6 pt-4 border-t border-dash-border2">
          <DashButton variant="ghost" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="!py-2.5">
            <ChevronLeft className="size-4" /> Voltar
          </DashButton>
          {step < 4 ? (
            <DashButton onClick={() => { if (canNext) setStep(s => s + 1); }} disabled={!canNext} className="!py-2.5">
              Continuar <ChevronRight className="size-4" />
            </DashButton>
          ) : (
            <DashButton onClick={sendCampaign} loading={sending} className="!py-2.5">
              <Send className="size-4" /> {schedule ? "Agendar disparo" : "Enviar agora"}
            </DashButton>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="dash-card lg:sticky lg:top-4 space-y-4">
        <div className="text-sm font-semibold text-dash-ink">Pré-visualização</div>
        {selectedTemplate ? (
          <div className="rounded-2xl border border-dash-border bg-[#0b141a] p-3 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="size-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600" />
              <div className="text-xs">
                <div className="font-semibold text-white">{selectedTemplate.name}</div>
                <div className="text-[10px] text-emerald-400">Template oficial</div>
              </div>
            </div>
            {headerComp?.text && (
              <div className="bg-[#202c33] rounded-lg px-3 py-2 text-[12px] font-semibold text-white">{headerComp.text}</div>
            )}
            <div className="bg-[#202c33] rounded-xl rounded-tl-sm px-3 py-2 text-[13px] text-[#e9edef] whitespace-pre-wrap break-words">
              {previewBody || bodyComp?.text || <span className="text-white/40 italic">Selecione um template</span>}
            </div>
            {selectedTemplate.components?.find(c => c.type === "BUTTONS")?.buttons?.map((b, i) => (
              <div key={i} className="bg-[#202c33] rounded-lg px-3 py-2 text-[12px] text-center text-emerald-400 border border-emerald-900/40">{b.text}</div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dash-border bg-dash-subtle p-6 text-center text-dash-faint text-sm">
            <Eye className="size-6 mx-auto mb-2 opacity-40" />
            Selecione um template para ver o preview
          </div>
        )}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-dash-faint">Template</span><span className="font-mono text-dash-ink font-medium">{selectedTemplate?.name || "—"}</span></div>
          <div className="flex justify-between"><span className="text-dash-faint">Contatos</span><span className="font-semibold text-dash-ink">{contacts.length}</span></div>
          <div className="flex justify-between"><span className="text-dash-faint">Variáveis</span><span className="text-dash-muted">{varKeys.length > 0 ? varKeys.map(k => `{{${k}}}`).join(", ") : "nenhuma"}</span></div>
          <div className="flex justify-between"><span className="text-dash-faint">Canal</span><span className="text-dash-green font-medium">API Meta</span></div>
        </div>
      </div>
    </div>
  );
}

// ── Modal de detalhe + export Excel ──────────────────────────
function DispatchDetailModal({ dispatch, onClose, onRefresh }) {
  const [filter, setFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [resendsLoading, setResendsLoading] = useState(false);

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

  async function handleResendFailed() {
    const count = (dispatch.delivery_failed || 0) + failed;
    if (!count) return;
    if (!confirm(`Reenviar para ${count} contato(s) com falha?`)) return;
    setResendsLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${API}/api/dispatches/${dispatch.id}/resend-failed`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      alert(`Novo disparo criado! ID: ${data.id}`);
      onClose();
      if (onRefresh) onRefresh();
    } catch (e) {
      alert("Erro ao reenviar: " + e.message);
    } finally {
      setResendsLoading(false);
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
  // Falha de entrega: usa o max entre o contador DB e a contagem dos items (mais preciso)
  const deliveryFailed = Math.max(
    dispatch.delivery_failed || 0,
    items.filter((i) => i.delivery_failed).length
  );
  // Contadores de entrega vindos direto do dispatch (atualizados via webhook SSE)
  const delivered = dispatch.delivered || 0;
  const readCount = dispatch.read || 0;

  const filtered = items.filter((i) => {
    if (filter === "all") return true;
    if (filter === "sent") return i.status === "sent" && !i.delivery_failed;
    if (filter === "failed") return i.status === "failed";
    if (filter === "delivery_failed") return !!i.delivery_failed;
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
        Status: i.delivery_failed ? "Falha entrega" : i.status === "sent" ? "Enviado" : i.status === "failed" ? "Falhou" : "Pendente",
        EnviadoEm: i.sentAt ? new Date(i.sentAt).toLocaleString("pt-BR") : "",
        Erro: i.delivery_error || i.error || "",
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

  const STATUS_COLORS = {
    sent: DASH_ACCENT.emerald,
    failed: DASH_ACCENT.red,
    sending: DASH_ACCENT.amber,
    pending: DASH_ACCENT.slate,
    delivery_failed: DASH_ACCENT.red,
  };
  const statusBadge = (item) => {
    if (item.delivery_failed) return <DashBadge color={DASH_ACCENT.red}>Falha entrega</DashBadge>;
    const st = item.status;
    const labels = { sent: "Enviado", failed: "Falhou", sending: "Enviando" };
    const key = labels[st] ? st : "pending";
    return <DashBadge color={STATUS_COLORS[key]}>{labels[st] || "Pendente"}</DashBadge>;
  };

  return (
    <DashModal
      open={!!dispatch}
      onClose={onClose}
      size="lg"
      title={dispatch.message_title || dispatch.messageTitle || "Detalhe do Disparo"}
      footer={
        <>
          <DashButton variant="ghost" onClick={onClose}>Fechar</DashButton>
          {isActive && (
            <DashButton variant="secondary" onClick={() => handleAction("pause")} loading={actionLoading === "pause"}>
              <Pause className="size-4" /> Pausar
            </DashButton>
          )}
          {isPaused && (
            <DashButton variant="secondary" onClick={() => handleAction("resume")} loading={actionLoading === "resume"}>
              <Play className="size-4" /> Retomar
            </DashButton>
          )}
          {(isActive || isPaused) && (
            <DashButton variant="danger" onClick={() => { if (confirm("Cancelar disparo? Os contatos pendentes não receberão a mensagem.")) handleAction("cancel"); }} loading={actionLoading === "cancel"}>
              <XCircle className="size-4" /> Cancelar
            </DashButton>
          )}
          {(deliveryFailed > 0 || failed > 0) && dispatch.status === "completed" && (
            <DashButton variant="secondary" onClick={handleResendFailed} loading={resendsLoading}>
              <Repeat2 className="size-4" /> Reenviar falhas ({deliveryFailed + failed})
            </DashButton>
          )}
          <DashButton onClick={exportXLSX} loading={exporting} disabled={!items.length}>
            <FileDown className="size-4" /> Exportar Excel
          </DashButton>
        </>
      }
    >
      <div className="grid grid-cols-4 gap-2 mb-2">
        <Stat label="Total" value={items.length} tone="neutral" />
        <Stat label="Enviados API" value={sent} tone="success" />
        <Stat label="Falha API" value={failed} tone={failed > 0 ? "danger" : "neutral"} />
        <Stat label="Pendentes" value={pending} tone={pending > 0 ? "warn" : "neutral"} />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-5">
        <Stat label="✓✓ Entregue" value={delivered} tone={delivered > 0 ? "success" : "neutral"} hint={sent > 0 ? `${Math.round(delivered / sent * 100)}%` : null} />
        <Stat label="✓✓ Lido" value={readCount} tone={readCount > 0 ? "success" : "neutral"} hint={sent > 0 ? `${Math.round(readCount / sent * 100)}%` : null} />
        <Stat label="✗ Falha entrega" value={deliveryFailed} tone={deliveryFailed > 0 ? "danger" : "neutral"} />
      </div>
      {deliveryFailed > 0 && (
        <div className="mb-4 rounded-xl border border-dash-red/40 bg-dash-red/[0.06] px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="size-4 text-dash-red mt-0.5 shrink-0" />
          <div className="flex-1 text-sm text-dash-ink2">
            <span className="font-semibold text-dash-red">{deliveryFailed} mensagem(s) com falha de entrega</span>
            {" "}— a Meta confirmou o envio mas a entrega falhou (limite diário ou erro de rede). Você pode reenviar amanhã.
          </div>
        </div>
      )}

      {(dispatch.message_content || dispatch.messageContent) && (
        <div className="mb-5">
          <div className="dash-section-label">Mensagem enviada</div>
          <div className="rounded-xl bg-dash-subtle border border-dash-border px-4 py-3 text-sm text-dash-ink2 whitespace-pre-wrap max-h-32 overflow-y-auto">
            {dispatch.message_content || dispatch.messageContent}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {[
          { v: "all",              label: `Todos (${items.length})` },
          { v: "sent",             label: `Enviados (${sent - deliveryFailed})` },
          { v: "failed",           label: `Falha API (${failed})` },
          { v: "delivery_failed",  label: `Falha entrega (${deliveryFailed})`, warn: deliveryFailed > 0 },
          { v: "pending",          label: `Pendentes (${pending})` },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              filter === f.v
                ? f.warn ? "bg-dash-red/10 text-dash-red border-dash-red/30" : "bg-dash-green/10 text-dash-green border-dash-green/30"
                : f.warn ? "bg-dash-red/[0.04] text-dash-red border-dash-red/20 hover:border-dash-red/40" : "bg-dash-subtle text-dash-muted border-dash-border hover:border-dash-faint"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-dash-border overflow-hidden max-h-[50vh] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-dash-subtle sticky top-0 z-10">
            <tr className="text-left">
              <th className="dash-th">Contato</th>
              <th className="dash-th">Número</th>
              <th className="dash-th">Status</th>
              <th className="dash-th hidden sm:table-cell">Quando</th>
              <th className="dash-th hidden md:table-cell">Erro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dash-border2">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-dash-faint">Nenhum item nesse filtro</td></tr>
            ) : filtered.map((i, idx) => (
              <tr key={idx} className={`hover:bg-dash-subtle ${i.delivery_failed ? "bg-dash-red/[0.03]" : ""}`}>
                <td className="px-3 py-2 font-medium text-dash-ink">{i.contactName || i.name || "—"}</td>
                <td className="px-3 py-2 text-dash-muted font-mono text-xs">{i.contactPhone || i.phone || "—"}</td>
                <td className="px-3 py-2">{statusBadge(i)}</td>
                <td className="px-3 py-2 text-dash-faint text-xs hidden sm:table-cell">{i.sentAt ? new Date(i.sentAt).toLocaleString("pt-BR") : "—"}</td>
                <td className="px-3 py-2 text-dash-red text-xs hidden md:table-cell max-w-xs truncate" title={i.delivery_error || i.error}>{i.delivery_error || i.error || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashModal>
  );
}

function Stat({ label, value, tone = "neutral", hint = null }) {
  const tones = {
    neutral: { bg: "bg-dash-subtle", border: "border-dash-border", text: "text-dash-ink" },
    success: { bg: "bg-dash-green/[0.08]", border: "border-dash-green/30", text: "text-dash-green" },
    danger:  { bg: "bg-dash-red/[0.08]", border: "border-dash-red/30", text: "text-dash-red" },
    warn:    { bg: "bg-dash-amber/[0.08]", border: "border-dash-amber/30", text: "text-dash-amber" },
  };
  const t = tones[tone];
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${t.bg} ${t.border} ${t.text}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70 font-semibold">{label}</div>
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <span className="text-2xl font-bold tabular-nums leading-tight">{value.toLocaleString("pt-BR")}</span>
        {hint && <span className="text-xs opacity-60 font-medium">{hint}</span>}
      </div>
    </div>
  );
}
