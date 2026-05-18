"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Users, MessageSquare, Zap, ArrowUpRight, Phone, ChevronRight,
  Sparkles, Send, Radio, DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Topbar from "../../components/dashboard/Topbar";
import { api, getUser, API_URL, getToken } from "../../lib/api";

/* ── paleta premium (escopo dashboard) ── */
const NEON = "#00FFAE";
const CYAN = "#00D1FF";

/* ── helpers ── */
function timeAgo(iso) {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function AnimatedNumber({ value = 0, prefix = "", suffix = "", duration = 900 }) {
  const [n, setN] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const t0 = performance.now();
    const animate = (t) => {
      const p = Math.min((t - t0) / duration, 1);
      setN(Math.round(value * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <span>{prefix}{n.toLocaleString("pt-BR")}{suffix}</span>;
}

const CHART_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs border border-white/10 backdrop-blur-xl"
      style={{ background: "rgba(11,17,32,0.92)", boxShadow: "0 20px 50px -20px rgba(0,0,0,0.8)" }}>
      <p className="text-ink-400 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const ACTIVITY_META = {
  message:  { icon: MessageSquare, color: NEON,      label: "Mensagem" },
  lead:     { icon: Users,         color: CYAN,      label: "Novo lead" },
  dispatch: { icon: Send,          color: "#F59E0B", label: "Disparo" },
  flow:     { icon: Zap,           color: "#7C3AED", label: "Automação" },
  connect:  { icon: Phone,         color: "#22C55E", label: "Conexão" },
};

function Skel({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.05] ${className}`} />;
}

/* ── Sparkline decorativo (tendência do volume real de disparos) ── */
function Sparkline({ data, color }) {
  const id = useMemo(() => `sk-${Math.random().toString(36).slice(2)}`, []);
  return (
    <ResponsiveContainer width="100%" height={38}>
      <AreaChart data={data} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2}
          fill={`url(#${id})`} dot={false} isAnimationActive />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ════════════════════ DASHBOARD ════════════════════ */
export default function DashboardHome() {
  const [stats, setStats] = useState({});
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [pulse, setPulse] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [range, setRange] = useState(7);
  const [insights, setInsights] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const feedRef = useRef(null);

  useEffect(() => {
    setUser(getUser());
    Promise.all([
      api("/api/stats").catch(() => ({})),
      api("/api/whatsapp/sessions").catch(() => []),
      api("/api/dispatches").catch(() => []),
    ]).then(([s, sess, disp]) => {
      setStats(s || {});
      setSessions(Array.isArray(sess) ? sess : []);
      const ds = Array.isArray(disp) ? disp : disp?.data || [];
      setDispatches(ds);

      // chartData agora vem do endpoint real /api/dashboard/timeseries

      const feed = [];
      (s?.lastLeads || []).slice(0, 4).forEach((l) => feed.push({
        id: `lead-${l.id}`, type: "lead",
        text: `Novo lead: ${l.name || l.phone}`,
        time: l.created_at || l.createdAt,
      }));
      ds.slice(0, 4).forEach((d) => feed.push({
        id: `disp-${d.id}`, type: "dispatch",
        text: `"${d.message_title || "Campanha"}" · ${d.sent || 0}/${d.total || 0} enviados`,
        time: d.created_at,
      }));
      feed.sort((a, b) => new Date(b.time) - new Date(a.time));
      setActivity(feed.slice(0, 12));
    }).finally(() => setLoading(false));
    api("/api/dashboard/insights").then(setInsights).catch(() => setInsights({ hours: [], channels: [], hasData: false }));
    api("/api/sales/summary?days=7").then(setRevenue).catch(() => setRevenue({ total: 0 }));
  }, []);

  // Série real por data (últimos `range` dias até hoje)
  useEffect(() => {
    api(`/api/dashboard/timeseries?days=${range}`)
      .then((r) => setChartData(Array.isArray(r?.series) ? r.series : []))
      .catch(() => setChartData([]));
  }, [range]);

  // SSE tempo real (mantido — funciona no backend da main)
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const es = new EventSource(`${API_URL}/api/chats/stream?token=${token}`);
    es.addEventListener("message", (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "message") {
          setPulse(true);
          setTimeout(() => setPulse(false), 1200);
          setActivity((prev) => [{
            id: `msg-${Date.now()}`, type: "message",
            text: `Mensagem de ${data.phone || "cliente"}${data.text ? `: "${data.text.slice(0, 50)}…"` : ""}`,
            time: new Date().toISOString(),
          }, ...prev].slice(0, 15));
          setStats((prev) => ({ ...prev, messagesSent: (prev.messagesSent || 0) + 1 }));
        }
      } catch {}
    });
    return () => es.close();
  }, []);

  const connectedSlots = sessions.filter((s) => s.status === "connected").length;
  const activeDispatches = dispatches.filter((d) => d.status === "sending").length;
  const firstName = user?.name?.split(" ")[0] || "Admin";

  // série decorativa p/ sparkline (volume real de envios por disparo)
  const spark = useMemo(() => {
    const arr = dispatches.slice(0, 8).reverse().map((d) => ({ v: d.sent || 0 }));
    return arr.length ? arr : Array.from({ length: 6 }, () => ({ v: 0 }));
  }, [dispatches]);

  const KPIs = [
    { label: "Total de Leads", value: stats.leads ?? 0, delta: "+12%", icon: Users, color: NEON },
    { label: "Mensagens Enviadas", value: stats.messagesSent ?? 0, delta: "+8%", icon: MessageSquare, color: CYAN },
    { label: "Campanhas Ativas", value: activeDispatches, delta: `${dispatches.length} total`, icon: Send, color: "#F59E0B" },
    { label: "Números Conectados", value: connectedSlots, delta: `de ${sessions.length}`, icon: Phone, color: "#22C55E" },
    {
      label: "Receita Gerada",
      money: revenue?.total ?? 0,
      delta: revenue?.deltaPct != null ? `${revenue.deltaPct >= 0 ? "+" : ""}${revenue.deltaPct}%` : "7d",
      icon: DollarSign,
      color: NEON,
    },
  ];

  const chart = chartData;

  // Funil honesto: só etapas com dado real (envios, leads, campanhas)
  const funnel = useMemo(() => {
    const enviadas = stats.messagesSent || 0;
    const leads = stats.leads || 0;
    const camp = dispatches.length || 0;
    const max = Math.max(enviadas, leads, camp, 1);
    return [
      { label: "Mensagens enviadas", value: enviadas, color: NEON },
      { label: "Leads capturados", value: leads, color: CYAN },
      { label: "Campanhas", value: camp, color: "#7C3AED" },
    ].map((s) => ({ ...s, pct: Math.round((s.value / max) * 100) }));
  }, [stats, dispatches]);

  const SRC_LABEL = { form: "Formulário", whatsapp: "WhatsApp", import: "Importação", manual: "Manual", instagram: "Instagram", facebook: "Facebook", site: "Site" };
  const CH_COLORS = [NEON, CYAN, "#7C3AED", "#F59E0B", "#22C55E", "#EC4899"];
  const channels = useMemo(() => {
    const list = insights?.channels || [];
    const total = list.reduce((a, c) => a + c.count, 0) || 1;
    return list.map((c, i) => ({
      name: SRC_LABEL[c.source] || c.source,
      value: c.count,
      pct: Math.round((c.count / total) * 100),
      color: CH_COLORS[i % CH_COLORS.length],
    }));
  }, [insights]);
  const maxHour = useMemo(
    () => Math.max(1, ...((insights?.hours || []).map((h) => h.value))),
    [insights]
  );
  const bestHour = useMemo(
    () => (insights?.hours || []).reduce((a, h) => (h.value > (a?.value || 0) ? h : a), null),
    [insights]
  );

  // Saúde operacional (heurística sobre dados reais)
  const health = useMemo(() => {
    const dlist = dispatches.filter((d) => (d.total || 0) > 0);
    const deliv = dlist.length
      ? dlist.reduce((a, d) => a + (d.sent || 0) / Math.max(d.total, 1), 0) / dlist.length
      : (connectedSlots > 0 ? 0.9 : 0);
    const chOk = connectedSlots > 0 ? 1 : 0;
    const revOk = (revenue?.total || 0) > 0 ? 1 : 0.6;
    const score = Math.round((deliv * 0.55 + chOk * 0.3 + revOk * 0.15) * 100);
    const label = score >= 80 ? "Operação estável" : score >= 55 ? "Operação saudável" : "Requer atenção";
    const tint = score >= 80 ? "#00FF88" : score >= 55 ? "#22D3EE" : "#F59E0B";
    return { score, label, tint };
  }, [dispatches, connectedSlots, revenue]);

  const aiStrip = useMemo(() => {
    const items = [];
    if (bestHour && bestHour.value > 0)
      items.push({ tint: "#22D3EE", title: "Melhor horário", text: `Pico de respostas ~${bestHour.h}. Agende campanhas nessa janela.` });
    const last = dispatches[0];
    if (last && (last.total || 0) > 0) {
      const r = Math.round(((last.sent || 0) / Math.max(last.total, 1)) * 100);
      if (r < 70) items.push({ tint: "#F59E0B", title: "Campanha fraca", text: `"${(last.message_title || "Última campanha").slice(0, 22)}" entregou ${r}%.` });
    }
    if ((stats.newLeads || 0) > 0)
      items.push({ tint: "#EF4444", title: "Leads quentes", text: `${stats.newLeads} lead(s) novo(s) — priorize o atendimento agora.` });
    if (items.length < 3)
      items.push({ tint: "#7C3AED", title: "Revenue ops", text: "Fluxo de follow-up recupera leads sem resposta." });
    return items.slice(0, 3);
  }, [bestHour, dispatches, stats]);

  const openCopilot = () => window.dispatchEvent(new CustomEvent("wayvo:open-copilot"));

  return (
    <>
      <Topbar title="Dashboard" subtitle="Central operacional WhatsApp" />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16">

        {/* ── HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-white/[0.06] p-6 lg:p-8"
          style={{ background: "linear-gradient(135deg, rgba(0,255,174,0.06) 0%, rgba(5,8,22,0.6) 45%, rgba(0,209,255,0.05) 100%)" }}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-16 w-96 h-96 rounded-full blur-3xl opacity-30"
              style={{ background: `radial-gradient(circle, ${NEON}26, transparent 70%)` }} />
            <div className="absolute -bottom-16 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-20"
              style={{ background: `radial-gradient(circle, ${CYAN}33, transparent 70%)` }} />
          </div>
          <div className="relative flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold mb-4"
                style={{ borderColor: `${NEON}40`, background: `${NEON}14`, color: NEON }}>
                <span className="size-1.5 rounded-full animate-pulse" style={{ background: NEON }} />
                SISTEMA OPERACIONAL ATIVO
              </div>
              <h1 className="text-2xl lg:text-[32px] font-bold tracking-tight">Olá, {firstName}! 👋</h1>
              <p className="text-ink-300 mt-2 text-sm">
                {connectedSlots > 0
                  ? `${connectedSlots} número${connectedSlots > 1 ? "s" : ""} conectado${connectedSlots > 1 ? "s" : ""} • operação estável`
                  : "Conecte um número WhatsApp para começar"}
              </p>
            </div>
            <div className="flex gap-2.5 flex-wrap">
              <Link href="/dashboard/campanhas"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-sm text-bg transition-all hover:scale-[1.02]"
                style={{ background: `linear-gradient(135deg, ${NEON}, ${CYAN})`, boxShadow: `0 8px 30px -8px ${NEON}80` }}>
                <Send className="size-4" /> Novo Disparo
              </Link>
              <Link href="/dashboard/workflow"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-medium text-sm border border-white/10 text-ink-100 hover:bg-white/[0.05] transition-all">
                <Zap className="size-4" /> Nova Automação
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ── Saúde operacional + IA ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="grid lg:grid-cols-[300px_1fr] gap-4"
        >
          <div className="rounded-2xl border border-white/[0.06] p-5 flex items-center gap-5"
            style={{ background: "linear-gradient(160deg,#0B1120,#0F172A)" }}>
            <div className="relative size-[84px] shrink-0">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
                <motion.circle
                  cx="50" cy="50" r="42" fill="none" stroke={health.tint} strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - (loading ? 0 : health.score) / 100) }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold tabular-nums" style={{ color: health.tint }}>
                  {loading ? "—" : health.score}
                </span>
                <span className="text-[9px] text-ink-500">/100</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-500">Saúde operacional</div>
              <div className="text-base font-bold mt-0.5" style={{ color: health.tint }}>{health.label}</div>
              <div className="text-[11px] text-ink-500 mt-1">
                {connectedSlots} canal(is) · entrega e estabilidade monitoradas
              </div>
            </div>
          </div>

          <button
            onClick={openCopilot}
            className="group rounded-2xl border border-secondary/25 p-5 text-left transition-colors hover:border-secondary/45"
            style={{ background: "linear-gradient(120deg, rgba(124,58,237,0.10), #0B1120 60%)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="size-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C3AED,#00D1FF)" }}>
                  <Sparkles className="size-3.5 text-white" />
                </span>
                <span className="text-sm font-semibold">Wayvo AI · insights</span>
              </div>
              <span className="text-[11px] text-secondary flex items-center gap-1 opacity-80 group-hover:opacity-100">
                Abrir copiloto <ChevronRight className="size-3.5" />
              </span>
            </div>
            <div className="grid sm:grid-cols-3 gap-2.5">
              {(loading ? Array.from({ length: 3 }) : aiStrip).map((it, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  {loading ? (
                    <div className="h-10 animate-pulse" />
                  ) : (
                    <>
                      <div className="text-[12px] font-semibold" style={{ color: it.tint }}>{it.title}</div>
                      <div className="text-[11px] text-ink-400 mt-1 leading-snug">{it.text}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </button>
        </motion.div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {KPIs.map((k, i) => {
            const Icon = k.icon;
            return (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 26 }}
                whileHover={{ y: -4 }}
                className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-5 group"
                style={{ background: "linear-gradient(160deg, #0B1120, #0F172A)" }}
              >
                <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ boxShadow: `inset 0 0 0 1px ${k.color}40, 0 0 36px -12px ${k.color}66` }} />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="size-9 rounded-xl flex items-center justify-center border"
                      style={{ background: `${k.color}16`, borderColor: `${k.color}33` }}>
                      <Icon className="size-[18px]" style={{ color: k.color }} />
                    </div>
                    <span className="text-[11px] font-semibold flex items-center gap-0.5 text-emerald-400">
                      <ArrowUpRight className="size-3" /> {k.delta}
                    </span>
                  </div>
                  <div className="mt-4 text-[26px] font-bold tracking-tight leading-none"
                    style={{ color: k.color }}>
                    {loading ? <Skel className="w-20 h-7" />
                      : k.money != null
                        ? Number(k.money).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
                        : <AnimatedNumber value={k.value} />}
                  </div>
                  <p className="text-xs text-ink-400 mt-1.5">{k.label}</p>
                  <div className="mt-2 -mx-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <Sparkline data={spark} color={k.color} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Performance + Atividade ── */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl border border-white/[0.06] p-5"
            style={{ background: "linear-gradient(160deg, #0B1120, #0F172A)" }}
          >
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h3 className="font-semibold">Performance da Semana</h3>
                <p className="text-xs text-ink-500 mt-0.5">Mensagens enviadas, leads e respostas</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-3 text-[11px] text-ink-400">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: NEON }} />Enviadas</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: CYAN }} />Leads</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-secondary" />Respostas</span>
                </div>
                <div className="flex gap-1 bg-white/[0.03] border border-white/10 rounded-lg p-0.5">
                  {[7, 14, 30].map((r) => (
                    <button key={r} onClick={() => setRange(r)}
                      className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${range === r ? "text-bg font-semibold" : "text-ink-400 hover:text-ink-100"}`}
                      style={range === r ? { background: NEON } : undefined}>
                      {r}d
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {loading ? (
              <Skel className="w-full h-56" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chart} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gN" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={NEON} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={NEON} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CYAN} stopOpacity={0.22} />
                      <stop offset="95%" stopColor={CYAN} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CHART_TOOLTIP />} />
                  <Area type="monotone" dataKey="enviadas" name="Enviadas" stroke={NEON} strokeWidth={2.5} fill="url(#gN)" dot={false} />
                  <Area type="monotone" dataKey="leads" name="Leads" stroke={CYAN} strokeWidth={2.5} fill="url(#gC)" dot={false} />
                  <Area type="monotone" dataKey="respostas" name="Respostas" stroke="#7C3AED" strokeWidth={2.5} fill="url(#gP)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Atividade ao vivo (SSE real) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
            className="rounded-2xl border border-white/[0.06] p-5 flex flex-col"
            style={{ background: "linear-gradient(160deg, #0B1120, #0F172A)" }}
          >
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${pulse ? "animate-ping" : ""}`} style={{ background: NEON }} />
                  <span className="relative inline-flex rounded-full size-2" style={{ background: NEON }} />
                </span>
                <h3 className="font-semibold text-sm">Atividade em Tempo Real</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${NEON}1a`, color: NEON }}>
                AO VIVO
              </span>
            </div>
            <div ref={feedRef} className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[300px] pr-1">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-2">
                    <Skel className="size-8 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-1.5"><Skel className="h-3 w-4/5" /><Skel className="h-2.5 w-1/3" /></div>
                  </div>
                ))
              ) : activity.length === 0 ? (
                <div className="py-12 text-center">
                  <Radio className="size-8 text-ink-600 mx-auto mb-2" />
                  <p className="text-ink-400 text-sm">Aguardando eventos…</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {activity.map((a) => {
                    const meta = ACTIVITY_META[a.type] || ACTIVITY_META.message;
                    const Icon = meta.icon;
                    return (
                      <motion.div
                        key={a.id}
                        layout
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="size-8 rounded-lg flex items-center justify-center shrink-0 border"
                          style={{ background: `${meta.color}16`, borderColor: `${meta.color}30` }}>
                          <Icon className="size-3.5" style={{ color: meta.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-ink-200 truncate leading-snug">{a.text}</p>
                          <p className="text-[10px] text-ink-500 mt-0.5">{timeAgo(a.time)}</p>
                        </div>
                        <span className="size-1.5 rounded-full shrink-0" style={{ background: meta.color }} />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Funil + Campanhas ── */}
        <div className="grid lg:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl border border-white/[0.06] p-5"
            style={{ background: "linear-gradient(160deg, #0B1120, #0F172A)" }}
          >
            <h3 className="font-semibold text-sm">Funil de Conversão</h3>
            <p className="text-xs text-ink-500 mt-0.5 mb-4">Com base nos dados reais</p>
            <div className="space-y-3">
              {funnel.map((f) => (
                <div key={f.label}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-ink-300">{f.label}</span>
                    <span className="font-semibold tabular-nums" style={{ color: f.color }}>
                      {f.value.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${f.pct}%` }}
                      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${f.color}, ${f.color}88)`, boxShadow: `0 0 12px -2px ${f.color}` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
            className="rounded-2xl border border-white/[0.06] p-5"
            style={{ background: "linear-gradient(160deg, #0B1120, #0F172A)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Campanhas Recentes</h3>
              <Link href="/dashboard/campanhas" className="text-[11px] hover:underline flex items-center gap-0.5" style={{ color: NEON }}>
                Ver todas <ChevronRight className="size-3" />
              </Link>
            </div>
            {dispatches.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-xl py-8 text-center">
                <Send className="size-6 text-ink-600 mx-auto mb-2" />
                <p className="text-ink-500 text-xs">Nenhuma campanha</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dispatches.slice(0, 4).map((d) => {
                  const pct = d.total ? Math.min(100, Math.round(((d.sent || 0) / d.total) * 100)) : 0;
                  return (
                    <div key={d.id} className="p-3 rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <p className="text-xs font-semibold truncate">{d.message_title || "Campanha"}</p>
                        <span className="text-[10px] text-ink-500 font-mono shrink-0">{d.sent || 0}/{d.total || 0}</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${NEON}, ${CYAN})` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>


        </div>


      </div>
    </>
  );
}
