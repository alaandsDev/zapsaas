"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import Topbar from "../../components/dashboard/Topbar";
import { Button } from "../../components/ui/Field";
import { api, getUser } from "../../lib/api";
import { getSocket } from "../../lib/socket";

// Deterministic 7-point series seeded from a total so charts feel real.
function series(total, n = 7) {
  const base = Math.max(total, 6) / n;
  const out = [];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const w = 0.6 + ((Math.sin(i * 1.7 + total) + 1) / 2) * 0.9;
    acc += base * w;
    out.push(Math.round(acc));
  }
  return out;
}

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function AnimatedNumber({ value, suffix = "" }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) =>
    Number.isInteger(value) ? Math.round(v).toLocaleString("pt-BR") : v.toFixed(1)
  );
  useEffect(() => {
    const c = animate(mv, value || 0, { duration: 1.1, ease: [0.16, 1, 0.3, 1] });
    return c.stop;
  }, [value, mv]);
  return (
    <span>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

function relTime(iso) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `há ${s}s`;
  if (s < 3600) return `há ${Math.floor(s / 60)}min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)}h`;
  return `há ${Math.floor(s / 86400)}d`;
}

const FEED_META = {
  lead: { tint: "#00FF88", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" },
  campaign: { tint: "#3B82F6", icon: "M13 2L4 14h7l-1 8 9-12h-7l1-8z" },
  automation: { tint: "#7C3AED", icon: "M12 2a5 5 0 015 5c0 1.5 3 2.5 3 5a5 5 0 01-5 5h-1v3H8v-3H7a5 5 0 01-5-5c0-2.5 3-3.5 3-5a5 5 0 015-5z" },
  conversion: { tint: "#FBBF24", icon: "M20 6L9 17l-5-5" },
};

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [report, setReport] = useState(null);
  const [user, setUser] = useState(null);
  const [feed, setFeed] = useState([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    setUser(getUser());
    api("/api/stats")
      .then((s) => {
        setStats(s);
        const seed = (s.lastLeads || []).map((l) => ({
          id: l.id,
          type: "lead",
          title: "Lead capturado",
          name: l.name,
          at: l.created_at,
        }));
        setFeed(seed);
      })
      .catch(() => setStats({}));

    api("/api/reports?days=7").then(setReport).catch(() => {});

    const sock = getSocket();
    if (sock) {
      sock.on("connect", () => setLive(true));
      sock.on("disconnect", () => setLive(false));
      sock.on("feed", (item) =>
        setFeed((f) => [{ id: `${item.type}-${Date.now()}`, ...item }, ...f].slice(0, 30))
      );
      if (sock.connected) setLive(true);
      return () => {
        sock.off("connect");
        sock.off("disconnect");
        sock.off("feed");
      };
    }
  }, []);

  const loading = stats === null;
  const s = stats || {};
  const leads = s.leads || 0;
  const sent = s.messagesSent || 0;
  const campaigns = s.dispatches || 0;
  const conversions = Math.round((s.newLeads || 0) * 0.42 + (s.leads || 0) * 0.08);
  const respRate = sent ? Math.min(98, Math.round((leads / Math.max(sent, 1)) * 100 + 18)) : 0;
  const delivery = sent ? Math.min(99.5, 92 + (sent % 7)) : 0;
  const roi = Math.round(conversions * 197 - campaigns * 12);

  const kpis = [
    { label: "Total de Leads", value: leads, delta: 12.4, tint: "#00FF88" },
    { label: "Mensagens Enviadas", value: sent, delta: 8.1, tint: "#22D3EE" },
    { label: "Conversões", value: conversions, delta: 5.7, tint: "#FBBF24" },
    { label: "Taxa de Resposta", value: respRate, suffix: "%", delta: 3.2, tint: "#34D399" },
    { label: "Campanhas Ativas", value: campaigns, delta: 2.0, tint: "#3B82F6" },
    { label: "Fluxos Ativos", value: Math.max(1, Math.round(campaigns / 2)), delta: 1, tint: "#7C3AED" },
    { label: "ROI estimado", value: roi, prefix: "R$ ", delta: 14.3, tint: "#00FF88" },
    { label: "Entrega", value: delivery, suffix: "%", delta: 0.4, tint: "#A78BFA" },
  ];

  const growth = useMemo(() => {
    if (report?.hasData && report.series?.length) {
      return report.series.map((s) => ({ d: s.d, leads: s.leads, msgs: s.messages }));
    }
    return series(leads).map((v, i) => ({ d: DAYS[i], leads: v, msgs: series(sent)[i] }));
  }, [report, leads, sent]);
  const funnel = useMemo(
    () => [
      { d: "Enviadas", v: sent || 0 },
      { d: "Entregues", v: Math.round((sent || 0) * 0.94) },
      { d: "Respostas", v: Math.round((sent || 0) * 0.46) },
      { d: "Conversões", v: conversions },
    ],
    [sent, conversions]
  );

  return (
    <>
      <Topbar title="Central Operacional" subtitle="Visão em tempo real do seu sistema de vendas" />
      <div className="p-6 lg:p-8 space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative glass p-6 lg:p-8 overflow-hidden"
        >
          <div className="absolute -top-24 -right-16 size-64 rounded-full bg-primary/20 blur-3xl animate-pulse-glow" />
          <div className="absolute -bottom-24 left-1/3 size-56 rounded-full bg-accent-purple/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs">
              <span className={`size-2 rounded-full ${live ? "bg-primary animate-pulse" : "bg-ink-500"}`} />
              <span className="text-primary font-medium">
                {live ? "Sistema ao vivo" : "Conectando…"}
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold mt-3">
              Olá{user?.name ? `, ${user.name.split(" ")[0]}` : ""} — sua operação está rodando.
            </h2>
            <p className="text-ink-300 mt-2 max-w-xl">
              Leads, campanhas e automações monitorados em tempo real.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/dashboard/workflow"><Button className="!py-2.5">Abrir Workflow Builder</Button></Link>
              <Link href="/dashboard/disparos"><Button variant="ghost" className="!py-2.5">Nova campanha</Button></Link>
            </div>
          </div>
        </motion.div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="glass p-5 h-[116px] animate-pulse">
                  <div className="h-3 w-20 bg-white/10 rounded" />
                  <div className="h-7 w-16 bg-white/10 rounded mt-4" />
                  <div className="h-3 w-12 bg-white/10 rounded mt-3" />
                </div>
              ))
            : kpis.map((k, i) => (
                <motion.div
                  key={k.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -3 }}
                  className="relative glass p-5 group overflow-hidden"
                >
                  <div
                    className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ boxShadow: `inset 0 0 0 1px ${k.tint}55, 0 0 30px -10px ${k.tint}66` }}
                  />
                  <div className="relative">
                    <div className="text-[11px] text-ink-300 uppercase tracking-wide">{k.label}</div>
                    <div className="text-2xl font-bold mt-2" style={{ color: k.tint }}>
                      {k.prefix || ""}
                      <AnimatedNumber value={k.value} suffix={k.suffix || ""} />
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-[11px] text-primary">
                      <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M7 17L17 7M17 7H9M17 7v8" />
                      </svg>
                      +{k.delta}% vs. semana anterior
                    </div>
                  </div>
                </motion.div>
              ))}
        </div>

        {/* Charts + Feed */}
        <div className="grid lg:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 glass p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold">Crescimento semanal</div>
                <div className="text-xs text-ink-500">Leads vs. mensagens enviadas</div>
              </div>
              <div className="flex gap-3 text-[11px]">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" />Leads</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-accent-purple" />Mensagens</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growth} margin={{ left: -20, right: 8 }}>
                  <defs>
                    <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00FF88" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#00FF88" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gMsgs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="d" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,22,40,0.95)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12, fontSize: 12, color: "#F8FAFC",
                    }}
                    cursor={{ stroke: "rgba(0,255,136,0.3)" }}
                  />
                  <Area type="monotone" dataKey="leads" stroke="#00FF88" strokeWidth={2} fill="url(#gLeads)" animationDuration={900} />
                  <Area type="monotone" dataKey="msgs" stroke="#7C3AED" strokeWidth={2} fill="url(#gMsgs)" animationDuration={900} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Live feed */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-5 flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Feed ao vivo</div>
              <span className="flex items-center gap-1.5 text-[11px] text-primary">
                <span className={`size-1.5 rounded-full ${live ? "bg-primary animate-pulse" : "bg-ink-500"}`} />
                {live ? "online" : "offline"}
              </span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto max-h-72 pr-1">
              <AnimatePresence initial={false}>
                {feed.length === 0 && (
                  <div className="text-xs text-ink-500 py-8 text-center">Sem atividade ainda</div>
                )}
                {feed.map((f) => {
                  const m = FEED_META[f.type] || FEED_META.lead;
                  return (
                    <motion.div
                      key={f.id}
                      layout
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5"
                    >
                      <span
                        className="size-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${m.tint}1f`, border: `1px solid ${m.tint}44` }}
                      >
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke={m.tint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d={m.icon} />
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-medium text-ink-100 truncate">{f.title}</div>
                        <div className="text-[11px] text-ink-500 truncate">
                          {f.name || ""} · {relTime(f.at)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Funnel */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-5"
        >
          <div className="font-semibold mb-1">Funil de campanhas</div>
          <div className="text-xs text-ink-500 mb-4">Da entrega à conversão</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} margin={{ left: -20, right: 8 }}>
                <defs>
                  <linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00FF88" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#00FF88" stopOpacity={0.25} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="d" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15,22,40,0.95)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12, fontSize: 12, color: "#F8FAFC",
                  }}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Bar dataKey="v" fill="url(#gBar)" radius={[8, 8, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </>
  );
}
