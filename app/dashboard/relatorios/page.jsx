"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import Topbar from "../../../components/dashboard/Topbar";
import { api } from "../../../lib/api";

const RANGES = [
  { d: 7, label: "7 dias" },
  { d: 30, label: "30 dias" },
  { d: 90, label: "90 dias" },
];

const tooltipStyle = {
  background: "rgba(15,22,40,0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  fontSize: 12,
  color: "#F8FAFC",
};

export default function Relatorios() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    api(`/api/reports?days=${days}`).then(setData).catch(() => setData({ series: [], hours: [], totals: {}, hasData: false }));
  }, [days]);

  const loading = data === null;
  const d = data || {};
  const totals = d.totals || {};
  const bestHour = (d.hours || []).reduce((a, h) => (h.value > (a?.value || 0) ? h : a), null);

  const kpis = [
    { label: "Leads", value: totals.leads || 0, tint: "#00FF88" },
    { label: "Mensagens", value: totals.messages || 0, tint: "#22D3EE" },
    { label: "Conversões", value: totals.conversions || 0, tint: "#FBBF24" },
    { label: "Campanhas", value: totals.campaigns || 0, tint: "#3B82F6" },
    { label: "Automações", value: totals.automations || 0, tint: "#7C3AED" },
  ];

  return (
    <>
      <Topbar
        title="Relatórios"
        subtitle="Histórico real da sua operação"
        actions={
          <div className="flex gap-1 bg-white/[0.03] border border-white/10 rounded-xl p-1">
            {RANGES.map((r) => (
              <button
                key={r.d}
                onClick={() => setDays(r.d)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  days === r.d ? "bg-primary/15 text-primary" : "text-ink-400 hover:text-ink-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />
      <div className="p-6 lg:p-8 space-y-6">
        {!loading && d.hasData === false && (
          <div className="glass p-4 text-sm text-ink-300">
            Ainda não há eventos suficientes neste período. Os relatórios começam a se
            preencher conforme leads, mensagens e automações acontecem.
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {(loading ? Array.from({ length: 5 }) : kpis).map((k, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass p-5"
            >
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-3 w-16 bg-white/10 rounded" />
                  <div className="h-7 w-12 bg-white/10 rounded mt-3" />
                </div>
              ) : (
                <>
                  <div className="text-[11px] uppercase tracking-wide text-ink-300">{k.label}</div>
                  <div className="text-2xl font-bold mt-2" style={{ color: k.tint }}>
                    {k.value.toLocaleString("pt-BR")}
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-5">
          <div className="font-semibold mb-1">Crescimento no período</div>
          <div className="text-xs text-ink-500 mb-4">Leads vs. mensagens por dia</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.series || []} margin={{ left: -20, right: 8 }}>
                <defs>
                  <linearGradient id="rL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00FF88" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#00FF88" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="d" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgba(0,255,136,0.3)" }} />
                <Area type="monotone" dataKey="leads" stroke="#00FF88" strokeWidth={2} fill="url(#rL)" animationDuration={800} />
                <Area type="monotone" dataKey="messages" stroke="#7C3AED" strokeWidth={2} fill="url(#rM)" animationDuration={800} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-5">
            <div className="font-semibold mb-1">Conversões por dia</div>
            <div className="text-xs text-ink-500 mb-4">Leads que viraram conversão</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.series || []} margin={{ left: -20, right: 8 }}>
                  <defs>
                    <linearGradient id="rC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.25} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="d" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="conversions" fill="url(#rC)" radius={[6, 6, 0, 0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold">Horários de melhor performance</div>
              {bestHour && bestHour.value > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                  pico {bestHour.h}
                </span>
              )}
            </div>
            <div className="text-xs text-ink-500 mb-4">Mensagens recebidas por hora</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.hours || []} margin={{ left: -20, right: 8 }}>
                  <defs>
                    <linearGradient id="rH" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00FF88" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="h" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} interval={3} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="value" fill="url(#rH)" radius={[6, 6, 0, 0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
