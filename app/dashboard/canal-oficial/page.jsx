"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, KeyRound, Webhook, LayoutTemplate, BadgeCheck, Activity,
  Search, Plus, Copy, Check, X, Loader2, Gauge, Wallet, Plug, RefreshCw,
  Building2, Zap, AlertTriangle, Clock, BarChart3, FileText, ChevronDown,
} from "lucide-react";
import { api } from "../../../lib/api";
import Topbar from "../../../components/dashboard/Topbar";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/wpp-cloud/webhook`
  : "https://api.wayvo.app.br/api/wpp-cloud/webhook";

const STEPS = [
  { n: 1, t: "Criar app no Meta for Developers", d: 'Em developers.facebook.com → "Criar app" → tipo "Business" → nomeie (ex: Wayvo Bot).' },
  { n: 2, t: "Adicionar produto WhatsApp", d: 'No app: "Adicionar produto" → WhatsApp → "Configurar" → associe a uma conta do Business Manager.' },
  { n: 3, t: "Obter Phone Number ID + WABA ID", d: 'WhatsApp → Introdução: copie o Phone Number ID, o WABA ID e o token de acesso.' },
  { n: 4, t: "System User permanente (recomendado)", d: 'Business Suite → Usuários do sistema → Adicionar (Admin) → gerar token com whatsapp_business_messaging e management (não expira).' },
  { n: 5, t: "Configurar Webhook no Meta", d: 'SOMENTE após salvar as credenciais aqui: WhatsApp → Configuração → Webhooks → cole a URL do Webhook e o Verify Token que você definiu no formulário; ative o campo "messages".' },
  { n: 6, t: "Salvar credenciais", d: 'Preencha o formulário de Credenciais e clique em "Salvar e validar" — verificamos com a Meta em tempo real.' },
];

/* ── constantes de mapeamento ── */
const TPL_STATUS = {
  APPROVED: { label: "Aprovado",  color: "#00FF88" },
  PENDING:  { label: "Em análise",color: "#FBBF24" },
  REJECTED: { label: "Rejeitado", color: "#EF4444" },
  PAUSED:   { label: "Pausado",   color: "#94A3B8" },
  DISABLED: { label: "Desativado",color: "#94A3B8" },
};
const QUALITY = {
  GREEN:   { label: "Alta",  color: "#00FF88", dot: "🟢" },
  YELLOW:  { label: "Média", color: "#FBBF24", dot: "🟡" },
  RED:     { label: "Baixa", color: "#EF4444", dot: "🔴" },
  UNKNOWN: { label: "—",     color: "#64748B", dot: "⚫" },
};
const VERIFICATION = {
  verified:     { label: "Verificada",     color: "#00FF88", dot: "🟢" },
  not_verified: { label: "Não verificada", color: "#EF4444", dot: "🔴" },
  in_review:    { label: "Em análise",     color: "#FBBF24", dot: "🟡" },
  rejected:     { label: "Rejeitada",      color: "#EF4444", dot: "🔴" },
};
const TIER_LABEL = {
  TIER_1K:       "1.000 / dia",
  TIER_10K:      "10.000 / dia",
  TIER_100K:     "100.000 / dia",
  TIER_UNLIMITED:"Ilimitado",
  TIER_250:      "250 / dia",
};

const CATEGORIES = ["MARKETING", "UTILITY", "AUTHENTICATION"];
const CAT_LABEL  = { MARKETING: "Marketing", UTILITY: "Utility", AUTHENTICATION: "Authentication" };
const PRICE_BR   = { MARKETING: 0.34, UTILITY: 0.04, AUTHENTICATION: 0.34 };
const COUNTRIES  = [
  { code: "BR", label: "Brasil",          mult: 1 },
  { code: "US", label: "Estados Unidos",  mult: 0.07 / 0.34 },
  { code: "MX", label: "México",          mult: 0.04 / 0.34 },
  { code: "IN", label: "Índia",           mult: 0.011 / 0.34 },
];

const LOG_LABELS = {
  sync:             { label: "Sincronização", icon: RefreshCw, color: "#22D3EE" },
  template_created: { label: "Template criado", icon: LayoutTemplate, color: "#7C3AED" },
  template_rejected:{ label: "Template rejeitado", icon: X, color: "#EF4444" },
  webhook_validated:{ label: "Webhook validado", icon: Webhook, color: "#00FF88" },
  token_updated:    { label: "Token atualizado", icon: KeyRound, color: "#FBBF24" },
  test_sent:        { label: "Teste enviado", icon: Plug, color: "#00D1FF" },
};

const brl = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function fmtTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60)    return "agora";
    if (diff < 3600)  return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  } catch { return "—"; }
}

/* ── componentes UI reutilizáveis ── */
function StatusCard({ icon: Icon, label, value, tint, sub, tooltip }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      title={tooltip}
      className="glass p-4 relative overflow-hidden group cursor-default"
    >
      <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px ${tint}33, 0 0 26px -12px ${tint}55` }} />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-[11px] text-ink-400">{label}</div>
          <div className="text-base font-bold mt-1.5 truncate" style={{ color: tint }}>{value}</div>
          {sub && <div className="text-[10px] text-ink-500 mt-0.5 truncate">{sub}</div>}
        </div>
        <span className="size-8 rounded-lg flex items-center justify-center border shrink-0"
          style={{ background: `${tint}14`, borderColor: `${tint}30` }}>
          <Icon className="size-4" style={{ color: tint }} />
        </span>
      </div>
    </motion.div>
  );
}

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-[11px] text-ink-400 uppercase tracking-wider mb-1.5 font-semibold">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-ink-500 mt-1">{hint}</p>}
  </div>
);
const Input = ({ type = "text", className = "", ...p }) => (
  <input type={type}
    className={`w-full bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary/60 text-sm transition-colors placeholder:text-ink-600 ${className}`}
    {...p} />
);
function Skel({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.05] ${className}`} />;
}

/* ── Health Score Card ── */
function HealthScore({ config, account, quality, templates, verify }) {
  const checks = useMemo(() => {
    const tplCount = Array.isArray(templates) ? templates.length : null;
    const approved = Array.isArray(templates) ? templates.filter(t => t.status === "APPROVED").length : null;
    return [
      {
        key: "api",
        label: "API",
        ok: !!config?.has_token,
        warn: false,
        detail: config?.has_token ? "Token configurado" : "Token ausente",
      },
      {
        key: "webhook",
        label: "Webhook",
        ok: !!config?.webhook_verify_token,
        warn: false,
        detail: config?.webhook_verify_token ? "Verify token definido" : "Pendente de configuração",
      },
      {
        key: "token_verify",
        label: "Token ativo",
        ok: !!verify?.ok,
        warn: !verify,
        detail: verify?.ok ? `${verify.verified_name || "Conectado"}` : verify ? "Falha na validação" : "Não testado",
      },
      {
        key: "conta",
        label: "Conta Meta",
        ok: account?.verification_status === "verified",
        warn: account?.verification_status === "in_review" || !!account?._error,
        detail: account?._error ? "Token sem permissão de gestão" : account ? (VERIFICATION[account.verification_status]?.label || account.verification_status) : (config?.business_account_id ? "Aguardando sync" : "WABA ID não configurado"),
      },
      {
        key: "templates",
        label: "Templates",
        ok: approved > 0,
        warn: tplCount === 0,
        detail: tplCount === null ? "Sincronize para ver" : `${approved}/${tplCount} aprovados`,
      },
      {
        key: "quality",
        label: "Qualidade",
        ok: quality?.quality_rating === "GREEN",
        warn: quality?.quality_rating === "YELLOW" || !!quality?._error,
        detail: quality?._error ? "Token sem permissão de mensagens" : quality ? (QUALITY[quality.quality_rating]?.label || "—") : "Sincronize para ver",
      },
    ];
  }, [config, account, quality, templates, verify]);

  const score = useMemo(() => {
    const w = [20, 15, 20, 15, 15, 15]; // pesos por check
    return checks.reduce((acc, c, i) => acc + (c.ok ? w[i] : c.warn ? w[i] * 0.4 : 0), 0);
  }, [checks]);

  const scoreLevel =
    score >= 70 ? { label: "Saudável",  color: "#00FF88", bg: "rgba(0,255,136,0.08)" } :
    score >= 40 ? { label: "Atenção",   color: "#FBBF24", bg: "rgba(251,191,36,0.08)" } :
                  { label: "Crítico",   color: "#EF4444", bg: "rgba(239,68,68,0.08)" };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="glass p-5 relative overflow-hidden"
      style={{ borderColor: `${scoreLevel.color}30` }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: scoreLevel.bg }} />
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Score gauge */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <div className="relative size-20">
            <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle cx="40" cy="40" r="32" fill="none" stroke={scoreLevel.color} strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${Math.round(score * 2.01)} 201`}
                style={{ transition: "stroke-dasharray 0.8s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black leading-none" style={{ color: scoreLevel.color }}>{Math.round(score)}</span>
              <span className="text-[9px] text-ink-500">/ 100</span>
            </div>
          </div>
          <span className="text-[11px] font-semibold" style={{ color: scoreLevel.color }}>{scoreLevel.label}</span>
        </div>

        {/* Checklist */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Saúde da Conta</h2>
            <span className="text-[10px] text-ink-500">Score {Math.round(score)}/100</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {checks.map((c) => (
              <div key={c.key} className="flex items-center gap-2 text-[12px]" title={c.detail}>
                <span className={`size-4 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold ${
                  c.ok   ? "bg-primary/15 text-primary" :
                  c.warn ? "bg-yellow-400/15 text-yellow-400" :
                           "bg-red-500/15 text-red-400"
                }`}>
                  {c.ok ? "✓" : c.warn ? "~" : "✕"}
                </span>
                <span className={c.ok ? "text-ink-200" : c.warn ? "text-yellow-400" : "text-ink-400"}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ── Verification blocker modal ── */
function VerificationModal({ verificationStatus, onContinue, onClose }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-[71] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-yellow-500/30 overflow-hidden"
          style={{ background: "linear-gradient(180deg,#0B1120,#0F172A)", boxShadow: "0 30px 80px -20px rgba(0,0,0,0.85)" }}>
          <div className="h-1 w-full bg-gradient-to-r from-yellow-500 to-orange-500" />
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-bold text-ink-100">Conta Meta ainda não verificada</h3>
                <p className="text-sm text-ink-400 mt-1 leading-relaxed">
                  Para criar templates oficiais a Meta exige que sua conta empresarial esteja verificada.
                  {verificationStatus === "in_review" && " Sua conta está em análise."}
                  {verificationStatus === "not_verified" && " Complete a verificação no Business Manager."}
                </p>
              </div>
            </div>

            <div className="mt-5 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-ink-400 leading-relaxed">
              <p className="font-semibold text-ink-200 mb-1.5">Como verificar sua conta:</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Acesse <a href="https://business.facebook.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">business.facebook.com</a></li>
                <li>Vá em Configurações → Central de Segurança</li>
                <li>Clique em "Iniciar verificação" e siga os passos</li>
              </ol>
            </div>

            <div className="flex gap-3 mt-5">
              <a href="https://business.facebook.com/settings/security" target="_blank" rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-yellow-500/40 text-yellow-400 text-sm font-semibold hover:bg-yellow-500/10 transition-colors">
                Como verificar →
              </a>
              <button onClick={onContinue}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-ink-200 text-sm font-semibold hover:bg-white/[0.1] transition-colors">
                Continuar mesmo assim
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

/* ════════════════════ TESTE YCLOUD (BSP) ════════════════════ */
function YCloudTestCard() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [msg, setMsg] = useState("Teste de envio via YCloud ✅");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { ok, text }

  async function send(body, okText) {
    setResult(null);
    if (!from.trim() || !to.trim()) {
      setResult({ ok: false, text: "Preencha número YCloud e destino." });
      return;
    }
    setSending(true);
    try {
      await api("/api/ycloud/test-send", { method: "POST", body: { from: from.trim(), to: to.trim(), ...body } });
      setResult({ ok: true, text: okText });
    } catch (e) {
      setResult({ ok: false, text: e.message || "Falha ao enviar" });
    } finally {
      setSending(false);
    }
  }
  const sendText = () => {
    if (!msg.trim()) return setResult({ ok: false, text: "Digite a mensagem." });
    send({ message: msg.trim() }, "Aceito! (texto livre só entrega dentro da janela de 24h)");
  };
  const sendTemplate = () => send({ template: "hello_world", language: "en_US" }, "Template enviado! Deve chegar no destino.");

  const [templates, setTemplates] = useState(null);
  async function loadTemplates() {
    setResult(null);
    try {
      const list = await api("/api/ycloud/templates");
      setTemplates(list || []);
      if (!list?.length) setResult({ ok: false, text: "Nenhum template na conta ainda." });
    } catch (e) {
      setResult({ ok: false, text: e.message || "Falha ao listar templates" });
    }
  }
  function sendNamed(t) {
    // Conta variáveis {{n}} no corpo do template
    const body = (t.components || []).find(c => c.type === "BODY")?.text || "";
    const n = (body.match(/\{\{\s*\d+\s*\}\}/g) || []).length;
    const params = [];
    for (let i = 1; i <= n; i++) {
      // Mostra o corpo com a variável atual destacada para o usuário saber qual é
      const preview = body.replace(new RegExp(`\\{\\{\\s*${i}\\s*\\}\\}`, "g"), `►{{${i}}}◄`);
      const val = window.prompt(`Variável {{${i}}} de ${n} — informe o valor:\n\n${preview}`, "");
      if (val === null) return; // cancelou
      params.push(val.trim());
    }
    send({ template: t.name, language: t.language, params }, `Template "${t.name}" enviado!`);
  }

  return (
    <section className="rounded-2xl border border-secondary/30 bg-secondary/[0.04] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="size-4 text-secondary" />
        <h3 className="text-sm font-semibold text-ink-100">Teste YCloud (BSP)</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/15 text-secondary border border-secondary/25">beta</span>
      </div>
      <div className="grid sm:grid-cols-3 gap-2 mb-2">
        <input value={from} onChange={e => setFrom(e.target.value)} placeholder="Número YCloud (from), ex: 5513..."
          className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-ink-100 outline-none focus:border-secondary/40" />
        <input value={to} onChange={e => setTo(e.target.value)} placeholder="Enviar para (seu número)"
          className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-ink-100 outline-none focus:border-secondary/40" />
        <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Mensagem"
          className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-ink-100 outline-none focus:border-secondary/40" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={sendTemplate} disabled={sending}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-bg disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#7C3AED,#00D1FF)" }}>
          {sending ? "Enviando..." : "Enviar template (hello_world) ✅"}
        </button>
        <button onClick={sendText} disabled={sending}
          className="px-4 py-2 rounded-lg text-xs font-medium text-ink-200 border border-white/[0.12] hover:bg-white/[0.04] disabled:opacity-60">
          Enviar texto livre
        </button>
        <button onClick={loadTemplates} disabled={sending}
          className="px-4 py-2 rounded-lg text-xs font-medium text-ink-200 border border-white/[0.12] hover:bg-white/[0.04] disabled:opacity-60">
          Listar templates
        </button>
        {result && (
          <span className={`text-xs ${result.ok ? "text-primary" : "text-red-400"}`}>{result.text}</span>
        )}
      </div>

      {templates && templates.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-[10px] text-ink-500">Templates da conta — clique para enviar ao destino:</p>
          {templates.map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
              <span className="font-medium text-ink-100">{t.name}</span>
              <span className="text-ink-500">· {t.language}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: t.status === "APPROVED" ? "#00FF8820" : "#FBBF2420", color: t.status === "APPROVED" ? "#00FF88" : "#FBBF24" }}>{t.status}</span>
              <button onClick={() => sendNamed(t)} disabled={sending || t.status !== "APPROVED"}
                className="ml-auto text-primary hover:underline disabled:opacity-40 disabled:no-underline">enviar →</button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-ink-600 mt-2">Use um template aprovado para testar a entrega real. Texto livre só chega depois que o cliente responde (janela de 24h).</p>
    </section>
  );
}

/* ════════════════════ NÚMEROS YCLOUD ════════════════════ */
function YCloudNumbersCard() {
  const [list, setList] = useState([]);
  const [limit, setLimit] = useState(1);
  const [phone, setPhone] = useState("");
  const [label, setLabel] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    api("/api/ycloud/numbers").then(d => {
      const arr = Array.isArray(d) ? d : (d?.numbers || []);
      setList(arr);
      if (d?.limit != null) setLimit(d.limit);
    }).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add() {
    setErr("");
    if (!phone.trim()) { setErr("Informe o número."); return; }
    try {
      await api("/api/ycloud/numbers", { method: "POST", body: { phone: phone.trim(), label: label.trim() || undefined } });
      setPhone(""); setLabel(""); load();
    } catch (e) { setErr(e.message || "Falha ao cadastrar"); }
  }
  async function remove(id) {
    try { await api(`/api/ycloud/numbers/${id}`, { method: "DELETE" }); load(); } catch {}
  }

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-1">
        <Building2 className="size-4 text-ink-400" />
        <h3 className="text-sm font-semibold text-ink-100">Números YCloud (oficial)</h3>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-ink-400">{list.length}/{limit} usado(s)</span>
      </div>
      <p className="text-[11px] text-ink-500 mb-3">Cadastre o número da empresa para receber mensagens dele aqui no Wayvo. Use só dígitos com DDI (ex: 15559850060). Seu plano permite {limit} número(s) oficial(is).</p>

      <div className="flex flex-wrap gap-2 mb-3">
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Número (ex: 15559850060)"
          className="flex-1 min-w-[180px] bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-ink-100 outline-none focus:border-primary/40" />
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Apelido (opcional)"
          className="flex-1 min-w-[140px] bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-ink-100 outline-none focus:border-primary/40" />
        <button onClick={add} className="px-4 py-2 rounded-lg text-xs font-semibold text-bg" style={{ background: "linear-gradient(135deg,#00FF88,#00D1FF)" }}>
          Cadastrar
        </button>
      </div>
      {err && <p className="text-xs text-red-400 mb-2">{err}</p>}

      {list.length > 0 ? (
        <div className="space-y-1.5">
          {list.map(n => (
            <div key={n.id} className="flex items-center gap-2 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
              <span className="font-medium text-ink-100">+{n.phone}</span>
              {n.label && <span className="text-ink-500">· {n.label}</span>}
              <button onClick={() => remove(n.id)} className="ml-auto text-ink-500 hover:text-red-400">remover</button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-ink-600">Nenhum número cadastrado ainda.</p>
      )}
    </section>
  );
}

/* ════════════════════ PÁGINA PRINCIPAL ════════════════════ */
export default function CanalOficialPage() {
  /* config */
  const [config, setConfig]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");
  const [ok, setOk]             = useState("");

  const [phoneNumberId, setPhoneNumberId]       = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [accessToken, setAccessToken]           = useState("");
  const [verifyToken, setVerifyToken]           = useState("");
  const [appSecret, setAppSecret]               = useState("");

  /* Meta data */
  const [templates, setTemplates]   = useState(null);
  const [account, setAccount]       = useState(null);   // WABA account
  const [quality, setQuality]       = useState(null);   // quality + tier
  const [verify, setVerify]         = useState(null);   // phone verify
  const [logs, setLogs]             = useState(null);
  const [lastSync, setLastSync]     = useState(null);
  const [syncing, setSyncing]       = useState(false);

  /* UI */
  const [tplQ, setTplQ]           = useState("");
  const [tplCat, setTplCat]       = useState("");
  const [tplStatus, setTplStatus] = useState("");
  const [mainTab, setMainTab]     = useState("templates"); // 'templates' | 'logs'
  const [modalOpen, setModalOpen] = useState(false);
  const [verifyBlocker, setVerifyBlocker] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [copied, setCopied]           = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [openGuide, setOpenGuide]     = useState(false);

  /* disconnect confirm */
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  /* test send */
  const [testTo, setTestTo]           = useState("");
  const [testTemplate, setTestTemplate] = useState("");
  const [testVars, setTestVars]         = useState("");
  const [testing, setTesting]           = useState(false);
  const [testMsg, setTestMsg]           = useState(null);

  /* costs */
  const [estCountry, setEstCountry]   = useState("BR");
  const [estCat, setEstCat]           = useState("MARKETING");
  const [estVolumeDay, setEstVolumeDay] = useState(100);

  /* ── loaders ── */
  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const c = await api("/api/wpp-cloud/config");
      setConfig(c);
      if (c) {
        setPhoneNumberId(c.phone_number_id || "");
        setBusinessAccountId(c.business_account_id || "");
        setVerifyToken(c.webhook_verify_token || "");
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const loadTemplates = useCallback(() => {
    if (!config?.has_token || !config?.business_account_id) return;
    api("/api/wpp-cloud/templates")
      .then((t) => { setTemplates(Array.isArray(t) ? t : []); })
      .catch(() => setTemplates([]));
  }, [config]);

  const loadAccount = useCallback(() => {
    if (!config?.has_token || !config?.business_account_id) return;
    api("/api/wpp-cloud/account")
      .then(setAccount)
      .catch((e) => setAccount({ _error: e.message || "Erro ao consultar conta Meta" }));
  }, [config]);

  const loadQuality = useCallback(() => {
    if (!config?.has_token) return;
    api("/api/wpp-cloud/quality")
      .then(setQuality)
      .catch((e) => setQuality({ _error: e.message || "Erro ao consultar qualidade" }));
  }, [config]);

  const loadLogs = useCallback(() => {
    api("/api/wpp-cloud/logs").then(setLogs).catch(() => setLogs([]));
  }, []);

  useEffect(() => {
    if (!config) return;
    loadTemplates();
    loadAccount();
    loadQuality();
    loadLogs();
  }, [config, loadTemplates, loadAccount, loadQuality, loadLogs]);

  /* ── Sync global paralelo ── */
  async function syncAll() {
    if (syncing || !config) return;
    setSyncing(true);
    try {
      const r = await api("/api/wpp-cloud/sync", { method: "POST" });
      if (r.verify)    setVerify({ ok: true, ...r.verify });
      if (r.account)   setAccount(r.account);
      if (r.templates) setTemplates(r.templates);
      if (r.quality)   setQuality(r.quality);
      setLastSync(new Date(r.synced_at || Date.now()));
      loadLogs();
    } catch (e) {
      console.error("sync error", e);
    } finally { setSyncing(false); }
  }

  /* ── save config ── */
  async function save(e) {
    e?.preventDefault();
    setErr(""); setOk(""); setSaving(true);
    try {
      if (!phoneNumberId.trim()) return setErr("Phone Number ID é obrigatório");
      if (!verifyToken.trim())   return setErr("Webhook Verify Token é obrigatório");
      const body = {
        phone_number_id: phoneNumberId.trim(),
        business_account_id: businessAccountId.trim() || null,
        webhook_verify_token: verifyToken.trim(),
        app_secret: appSecret.trim() || null,
      };
      if (accessToken.trim()) {
        const tk = accessToken.trim();
        if (/\s/.test(tk) || /;|create\s+table|alter\s+table|select\s|<[a-z]/i.test(tk) || tk.length > 800) {
          return setErr("Isso não parece um Access Token da Meta. Cole apenas o token do System User (EAAxxxxxx…), sem espaços.");
        }
        body.access_token = tk;
      } else if (!config?.has_token) {
        return setErr("Access Token é obrigatório na primeira configuração");
      } else {
        return setErr("Cole o Access Token novamente para atualizar (oculto por segurança)");
      }
      const result = await api("/api/wpp-cloud/config", { method: "POST", body });
      setOk(result?.warning
        ? "Credenciais salvas. Aviso: não foi possível validar o número com a Meta — verifique se o System User tem acesso à conta WABA."
        : "Credenciais validadas e salvas com sucesso.");
      setAccessToken(""); setAppSecret("");
      loadConfig();
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  }

  async function testConnection() {
    setTestingConn(true); setVerify(null);
    try {
      const r = await api("/api/wpp-cloud/verify");
      setVerify(r);
    } catch (e) { setVerify({ ok: false, error: e.message }); }
    finally { setTestingConn(false); }
  }

  async function sendTest() {
    setTestMsg(null); setTesting(true);
    try {
      const variables = testVars.split(",").map((v) => v.trim()).filter(Boolean);
      const r = await api("/api/wpp-cloud/test", {
        method: "POST",
        body: { to: testTo.trim(), template: testTemplate, variables },
      });
      setTestMsg({ ok: true, text: `Enviado · ID ${r.messages?.[0]?.id || "—"}` });
    } catch (e) {
      setTestMsg({ ok: false, text: e.message || "Falha no envio" });
    } finally { setTesting(false); }
  }

  async function disconnect() {
    try {
      await api("/api/wpp-cloud/config", { method: "DELETE" });
      setConfig(null); setTemplates(null); setVerify(null); setAccount(null); setQuality(null);
      setPhoneNumberId(""); setBusinessAccountId(""); setVerifyToken("");
      setConfirmDisconnect(false);
      setOk("Configuração removida.");
    } catch (e) { setErr(e.message); setConfirmDisconnect(false); }
  }

  function handleNewTemplate() {
    if (account && account.verification_status !== "verified") {
      setVerifyBlocker(true);
    } else {
      setModalOpen(true);
    }
  }

  const copyWebhook = () => {
    navigator.clipboard?.writeText(WEBHOOK_URL).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };
  const copyVerifyToken = () => {
    if (!verifyToken.trim()) return;
    navigator.clipboard?.writeText(verifyToken.trim()).then(() => { setCopiedToken(true); setTimeout(() => setCopiedToken(false), 1500); });
  };

  /* ── computed ── */
  const connected = !!config;
  const verStatus = account?.verification_status;
  const verInfo   = VERIFICATION[verStatus] || { label: "—", color: "#64748B", dot: "⚫" };
  const qualInfo  = QUALITY[quality?.quality_rating || "UNKNOWN"];
  const tplApproved  = templates ? templates.filter(t => t.status === "APPROVED").length  : null;
  const tplPending   = templates ? templates.filter(t => t.status === "PENDING").length   : null;
  const tplRejected  = templates ? templates.filter(t => t.status === "REJECTED").length  : null;

  const statusCards = [
    {
      icon: Plug, label: "API Oficial",
      value: connected ? "Conectada" : "Não configurada",
      tint: connected ? "#00FF88" : "#FBBF24",
      sub: config?.verified_name || (connected ? "Sistema User ativo" : "configure abaixo"),
      tooltip: "Status da conexão com a API Cloud da Meta",
    },
    {
      icon: KeyRound, label: "Token de acesso",
      value: config?.has_token ? "Configurado" : "Ausente",
      tint: config?.has_token ? "#00FF88" : "#EF4444",
      sub: config?.has_token ? "System User permanente" : "obrigatório",
      tooltip: "Access Token do System User — nunca expira se configurado como permanente",
    },
    {
      icon: Webhook, label: "Webhook",
      value: config?.webhook_verify_token ? "Configurado" : "Pendente",
      tint: config?.webhook_verify_token ? "#22D3EE" : "#FBBF24",
      sub: "verify token por tenant",
      tooltip: "Cada conta tem seu próprio verify token — seguro e isolado",
    },
    {
      icon: LayoutTemplate, label: "Templates",
      value: templates == null ? "—" : `${templates.length} total`,
      tint: "#7C3AED",
      sub: templates != null ? `${tplApproved} aprovados · ${tplPending} pendentes · ${tplRejected} rejeitados` : "sincronize para ver",
      tooltip: "Templates oficiais sincronizados da WABA",
    },
    {
      icon: Building2, label: "Conta Meta",
      value: account?._error ? "Sem permissão" : account ? `${verInfo.dot} ${verInfo.label}` : (config?.business_account_id ? "Carregando…" : "—"),
      tint: account?._error ? "#EF4444" : verInfo.color,
      sub: account?._error ? "Token sem whatsapp_business_management" : (account?.name || "empresa vinculada"),
      tooltip: account?._error ? account._error : "Status de verificação empresarial da Meta",
    },
    {
      icon: Gauge, label: "Qualidade",
      value: quality?._error ? "Sem permissão" : quality ? `${qualInfo.dot} ${qualInfo.label}` : "—",
      tint: quality?._error ? "#EF4444" : qualInfo.color,
      sub: quality?._error ? "Token sem whatsapp_business_messaging" : (quality?.messaging_limit_tier ? (TIER_LABEL[quality.messaging_limit_tier] || quality.messaging_limit_tier) : "limite de conversas/dia"),
      tooltip: quality?._error ? quality._error : "Qualidade afeta limites de envio e entrega. Verde = sem restrições.",
    },
  ];

  const filteredTpls = useMemo(() => {
    let out = templates || [];
    if (tplCat)    out = out.filter((t) => t.category === tplCat);
    if (tplStatus) out = out.filter((t) => t.status === tplStatus);
    const q = tplQ.toLowerCase().trim();
    if (q) out = out.filter((t) => (t.name || "").toLowerCase().includes(q));
    return out;
  }, [templates, tplCat, tplStatus, tplQ]);

  const est = useMemo(() => {
    const country = COUNTRIES.find((c) => c.code === estCountry) || COUNTRIES[0];
    const per = (PRICE_BR[estCat] || 0) * country.mult;
    const day = per * Math.max(0, Number(estVolumeDay) || 0);
    return { per, day, month: day * 30, year: day * 365 };
  }, [estCountry, estCat, estVolumeDay]);

  /* ── loading ── */
  if (loading) return (
    <>
      <Topbar title="Canal Oficial" subtitle="Central operacional da API oficial do WhatsApp (Meta)" />
      <div className="p-6 lg:p-8 space-y-4">
        <Skel className="h-28" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skel key={i} className="h-24" />)}
        </div>
      </div>
    </>
  );

  /* ── sync button para topbar ── */
  const syncBtn = connected ? (
    <button
      onClick={syncAll}
      disabled={syncing}
      className="inline-flex items-center gap-2 text-sm px-3.5 py-2 rounded-xl border border-white/10 text-ink-200 hover:bg-white/[0.05] disabled:opacity-50 transition-colors"
    >
      {syncing ? <Loader2 className="size-4 animate-spin text-primary" /> : <RefreshCw className="size-4" />}
      {syncing ? "Sincronizando…" : "Sincronizar Meta"}
    </button>
  ) : null;

  return (
    <>
      <Topbar
        title="Canal Oficial"
        subtitle={lastSync ? `Última sync: ${fmtTime(lastSync)}` : "Central operacional da API oficial do WhatsApp (Meta)"}
        actions={syncBtn}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16">

        {/* ── TESTE YCLOUD ── */}
        <YCloudTestCard />

        {/* ── NÚMEROS YCLOUD ── */}
        <YCloudNumbersCard />

        {/* ── HEALTH SCORE ── */}
        <HealthScore config={config} account={account} quality={quality} templates={templates} verify={verify} />

        {/* ── STATUS CARDS ── */}
        <section className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {statusCards.map((c, i) => <StatusCard key={i} {...c} />)}
        </section>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="space-y-6 min-w-0">

            {/* ── TABS: Templates | Logs ── */}
            <div className="flex items-center gap-1 border-b border-white/[0.06]">
              {[
                { k: "templates", label: "Templates", icon: LayoutTemplate },
                { k: "logs",      label: "Logs",      icon: FileText },
              ].map(({ k, label, icon: Icon }) => (
                <button
                  key={k}
                  onClick={() => { setMainTab(k); if (k === "logs") loadLogs(); }}
                  className={`relative flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                    mainTab === k ? "text-primary" : "text-ink-400 hover:text-ink-200"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                  {mainTab === k && (
                    <motion.span layoutId="canal-tab" className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>

            {/* ── TAB: TEMPLATES ── */}
            <AnimatePresence mode="wait">
              {mainTab === "templates" && (
                <motion.section key="tpl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="glass p-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                    <div>
                      <h2 className="font-semibold">Templates oficiais</h2>
                      <p className="text-xs text-ink-500 mt-0.5">Sincronizados da sua conta WhatsApp Business (Meta)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {templates != null && (
                        <div className="flex items-center gap-2 text-[11px] text-ink-400">
                          <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-primary" />{tplApproved} aprovados</span>
                          <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-yellow-400" />{tplPending} pendentes</span>
                          <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-red-400" />{tplRejected} rejeitados</span>
                        </div>
                      )}
                      <button onClick={loadTemplates} title="Sincronizar templates"
                        className="size-9 rounded-lg border border-white/10 flex items-center justify-center text-ink-400 hover:text-primary hover:bg-white/[0.04] transition-colors">
                        <RefreshCw className="size-4" />
                      </button>
                      <button onClick={handleNewTemplate}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-bg"
                        style={{ background: "linear-gradient(135deg,#00FF88,#00D1FF)" }}>
                        <Plus className="size-4" /> Novo Template
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-500" />
                      <input value={tplQ} onChange={(e) => setTplQ(e.target.value)} placeholder="Buscar template…"
                        className="w-full rounded-lg bg-white/[0.03] border border-white/[0.08] pl-9 pr-3 py-2 text-sm outline-none focus:border-primary/50 placeholder:text-ink-600" />
                    </div>
                    <select value={tplCat} onChange={(e) => setTplCat(e.target.value)}
                      className="bg-bg/60 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
                      <option value="">Categoria</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                    </select>
                    <select value={tplStatus} onChange={(e) => setTplStatus(e.target.value)}
                      className="bg-bg/60 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
                      <option value="">Status</option>
                      {Object.entries(TPL_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>

                  {templates == null ? (
                    <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skel key={i} className="h-12" />)}</div>
                  ) : !config?.has_token ? (
                    <div className="py-12 text-center">
                      <LayoutTemplate className="size-10 mx-auto mb-3 text-ink-700" />
                      <p className="text-sm text-ink-500">Configure as credenciais Meta para sincronizar seus templates.</p>
                    </div>
                  ) : filteredTpls.length === 0 ? (
                    <div className="py-12 text-center">
                      <LayoutTemplate className="size-10 mx-auto mb-3 text-ink-700" />
                      <p className="text-sm text-ink-500">Nenhum template encontrado.</p>
                      {!tplQ && !tplCat && !tplStatus && (
                        <button onClick={handleNewTemplate}
                          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-xl px-4 py-2 hover:bg-primary/10 transition-colors">
                          <Plus className="size-3.5" /> Criar primeiro template
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-1">
                      <table className="w-full text-sm">
                        <thead className="text-[11px] uppercase tracking-wider text-ink-500">
                          <tr className="text-left">
                            <th className="px-3 py-2 font-medium">Nome</th>
                            <th className="px-3 py-2 font-medium">Categoria</th>
                            <th className="px-3 py-2 font-medium">Status</th>
                            <th className="px-3 py-2 font-medium">Qualidade</th>
                            <th className="px-3 py-2 font-medium">Idioma</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {filteredTpls.map((t) => {
                            const st = TPL_STATUS[t.status] || { label: t.status || "—", color: "#94A3B8" };
                            const ql = QUALITY[(t.quality_score?.score || "UNKNOWN").toUpperCase()] || QUALITY.UNKNOWN;
                            return (
                              <tr key={t.id || t.name} className="hover:bg-white/[0.02]">
                                <td className="px-3 py-3 font-medium truncate max-w-[220px]">{t.name}</td>
                                <td className="px-3 py-3 text-ink-300">{CAT_LABEL[t.category] || t.category || "—"}</td>
                                <td className="px-3 py-3">
                                  <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                                    style={{ background: `${st.color}1a`, color: st.color, borderColor: `${st.color}40` }}>
                                    {st.label}
                                  </span>
                                </td>
                                <td className="px-3 py-3">
                                  <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: ql.color }}>
                                    <span className="size-2 rounded-full" style={{ background: ql.color }} />{ql.label}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-ink-400 uppercase text-[12px]">{t.language || "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.section>
              )}

              {/* ── TAB: LOGS ── */}
              {mainTab === "logs" && (
                <motion.section key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="glass p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-semibold flex items-center gap-2"><FileText className="size-4 text-primary" /> Logs de eventos</h2>
                      <p className="text-xs text-ink-500 mt-0.5">Histórico das ações do Canal Oficial</p>
                    </div>
                    <button onClick={loadLogs}
                      className="size-9 rounded-lg border border-white/10 flex items-center justify-center text-ink-400 hover:text-primary hover:bg-white/[0.04] transition-colors">
                      <RefreshCw className="size-4" />
                    </button>
                  </div>

                  {logs == null ? (
                    <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skel key={i} className="h-12" />)}</div>
                  ) : logs.length === 0 ? (
                    <div className="py-12 text-center">
                      <Clock className="size-10 mx-auto mb-3 text-ink-700" />
                      <p className="text-sm text-ink-500">Nenhum evento registrado ainda.</p>
                      <p className="text-xs text-ink-600 mt-1">Ações como sincronizações e criação de templates aparecem aqui.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {logs.map((log) => {
                        const meta = LOG_LABELS[log.action] || { label: log.action, icon: Activity, color: "#94A3B8" };
                        const Icon = meta.icon;
                        return (
                          <div key={log.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">
                            <span className="size-7 rounded-lg flex items-center justify-center border shrink-0"
                              style={{ background: `${meta.color}14`, borderColor: `${meta.color}30` }}>
                              <Icon className="size-3.5" style={{ color: meta.color }} />
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-medium text-ink-100">{meta.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                  log.result === "ok"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-red-500/10 text-red-400"
                                }`}>
                                  {log.result === "ok" ? "✓ ok" : "✕ erro"}
                                </span>
                              </div>
                              {log.error_msg && <p className="text-[11px] text-red-400 truncate">{log.error_msg}</p>}
                              {log.details && !log.error_msg && (
                                <p className="text-[11px] text-ink-500 truncate">
                                  {log.details.synced ? `Sincronizou: ${log.details.synced.join(", ")}` :
                                   log.details.name   ? `Template: ${log.details.name}` : JSON.stringify(log.details).slice(0, 80)}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] text-ink-600 shrink-0">{fmtTime(log.created_at)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.section>
              )}
            </AnimatePresence>

            {/* ── BANNER ── */}
            {!config && (
              <section className="rounded-2xl border border-[#FBBF24]/30 bg-[#FBBF24]/05 px-5 py-4 flex gap-3">
                <span className="text-xl shrink-0">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-[#FBBF24]">Configure aqui primeiro, depois vá ao Meta</p>
                  <p className="text-xs text-ink-400 leading-relaxed mt-0.5">
                    Preencha o formulário abaixo e clique em <strong className="text-ink-200">Salvar e validar</strong>.
                    Só depois acesse o painel do Meta → WhatsApp → Configuração → Webhooks e cole a URL e o Verify Token.
                  </p>
                </div>
              </section>
            )}

            {/* ── CREDENCIAIS ── */}
            <section className="glass p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold flex items-center gap-2"><KeyRound className="size-4 text-primary" /> Credenciais Meta</h2>
                  <p className="text-xs text-ink-500 mt-0.5">Validadas com a Meta antes de salvar</p>
                </div>
                {config && (
                  <div className="flex items-center gap-2">
                    {config?.has_token && (
                      <button onClick={testConnection} disabled={testingConn}
                        className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-white/10 text-ink-200 hover:bg-white/[0.05] disabled:opacity-50">
                        {testingConn ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />} Testar conexão
                      </button>
                    )}
                    {confirmDisconnect ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-400">Remover configuração?</span>
                        <button onClick={disconnect}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-colors font-semibold">
                          Sim
                        </button>
                        <button onClick={() => setConfirmDisconnect(false)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-ink-300 hover:bg-white/[0.1] transition-colors">
                          Não
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDisconnect(true)}
                        className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                        <X className="size-4" /> Remover
                      </button>
                    )}
                  </div>
                )}
              </div>

              {verify && (
                <div className={`mb-4 text-sm rounded-xl px-4 py-3 border ${verify.ok ? "bg-primary/10 border-primary/25 text-primary" : "bg-red-500/10 border-red-500/25 text-red-300"}`}>
                  {verify.ok
                    ? `Conexão OK · ${verify.verified_name || "número"} · ${verify.display_phone || ""}`
                    : `Falha: ${verify.error}`}
                </div>
              )}

              <form onSubmit={save} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Phone Number ID *" hint="WhatsApp → Introdução → ID do número">
                    <Input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="123456789012345" required />
                  </Field>
                  <Field label="Business Account ID (WABA)" hint="Necessário para templates e info da conta">
                    <Input value={businessAccountId} onChange={(e) => setBusinessAccountId(e.target.value)} placeholder="987654321098765" />
                  </Field>
                </div>
                <Field label="Access Token *" hint="Token do System User permanente — oculto após salvar">
                  <Input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)}
                    placeholder={config?.has_token ? "•••••••• (cole novamente para atualizar)" : "EAAxxxxxx…"} />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Webhook Verify Token *" hint="Defina qualquer string — use este mesmo valor no painel do Meta">
                    <div className="flex gap-2">
                      <Input value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} placeholder="meu_token_secreto_123" required className="flex-1" />
                      <button type="button" onClick={copyVerifyToken} disabled={!verifyToken.trim()}
                        className="px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-ink-300 text-xs shrink-0 inline-flex items-center gap-1.5 disabled:opacity-40">
                        {copiedToken ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
                        {copiedToken ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                  </Field>
                  <Field label="App Secret (opcional)" hint="Valida HMAC do webhook">
                    <Input type="password" value={appSecret} onChange={(e) => setAppSecret(e.target.value)}
                      placeholder={config?.has_app_secret ? "•••••••• (preencha p/ atualizar)" : "Do painel do app Meta"} />
                  </Field>
                </div>
                <Field label="URL do Webhook">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 text-primary break-all">{WEBHOOK_URL}</code>
                    <button type="button" onClick={copyWebhook}
                      className="px-3 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-ink-300 text-xs shrink-0 inline-flex items-center gap-1.5">
                      {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />} {copied ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                </Field>
                {config?.webhook_verify_token && (
                  <div className="rounded-xl border border-[#22D3EE]/25 bg-[#22D3EE]/05 px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-ink-500 uppercase tracking-wider mb-0.5">Token salvo no banco (use este no Meta)</p>
                      <code className="text-[13px] font-bold text-[#22D3EE]">{config.webhook_verify_token}</code>
                    </div>
                    <button type="button" onClick={() => { navigator.clipboard?.writeText(config.webhook_verify_token); setCopiedToken(true); setTimeout(() => setCopiedToken(false), 1500); }}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-ink-300 text-xs shrink-0 inline-flex items-center gap-1.5">
                      {copiedToken ? <Check className="size-3.5 text-[#22D3EE]" /> : <Copy className="size-3.5" />} {copiedToken ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                )}
                {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
                {ok  && <div className="text-sm text-primary bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">{ok}</div>}
                <button type="submit" disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-bg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  {saving ? "Validando com a Meta…" : "Salvar e validar"}
                </button>
              </form>
            </section>
          </div>

          {/* ── COLUNA DIREITA ── */}
          <div className="space-y-6">

            {/* CONTA META — detalhes */}
            {(account || config?.business_account_id) && (
              <section className="glass p-5">
                <h2 className="font-semibold flex items-center gap-2 mb-4">
                  <Building2 className="size-4 text-primary" /> Conta Meta
                </h2>
                <div className="space-y-3">
                  {account ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-ink-500">Empresa</span>
                        <span className="text-xs font-semibold text-ink-100">{account.name || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-ink-500">Verificação</span>
                        <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: verInfo.color }}>
                          <span className="size-1.5 rounded-full" style={{ background: verInfo.color }} />
                          {verInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-ink-500">WABA ID</span>
                        <code className="text-[11px] text-ink-300">{account.id || config?.business_account_id}</code>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skel key={i} className="h-5" />)}</div>
                  )}
                  {quality && (
                    <>
                      <div className="border-t border-white/[0.06] pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-ink-500">Qualidade</span>
                          <span className="text-xs font-semibold" style={{ color: qualInfo.color }}>
                            {qualInfo.dot} {qualInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-ink-500">Limite diário</span>
                          <span className="text-xs font-semibold text-ink-100">
                            {quality.messaging_limit_tier ? (TIER_LABEL[quality.messaging_limit_tier] || quality.messaging_limit_tier) : "—"}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                  <button onClick={() => { loadAccount(); loadQuality(); }}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-ink-400 hover:text-ink-200 py-2 border border-white/[0.06] rounded-xl hover:border-white/[0.12] transition-colors mt-1">
                    <RefreshCw className="size-3.5" /> Atualizar status
                  </button>
                </div>
              </section>
            )}

            {/* ESTIMATIVA DE CUSTOS — oculta do cliente final por enquanto (trocar para true p/ reexibir) */}
            {false && (
            <section className="glass p-5">
              <h2 className="font-semibold flex items-center gap-2"><Wallet className="size-4 text-primary" /> Estimativa de custos</h2>
              <p className="text-xs text-ink-500 mt-0.5 mb-4">Projeção por volume diário de conversas</p>
              <div className="space-y-3">
                <Field label="País">
                  <select value={estCountry} onChange={(e) => setEstCountry(e.target.value)}
                    className="w-full bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none">
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </Field>
                <Field label="Categoria">
                  <select value={estCat} onChange={(e) => setEstCat(e.target.value)}
                    className="w-full bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                  </select>
                </Field>
                <Field label="Volume diário (conversas)">
                  <Input type="number" min={0} value={estVolumeDay} onChange={(e) => setEstVolumeDay(e.target.value)} />
                </Field>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  ["Por conversa", brl(est.per)],
                  ["Custo/dia",    brl(est.day)],
                  ["Custo/mês",   brl(est.month)],
                  ["Custo/ano",   brl(est.year)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="text-[10px] text-ink-500 uppercase tracking-wide">{k}</div>
                    <div className="text-base font-bold text-primary mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-ink-600 mt-3 leading-relaxed">
                ⚠ Estimativa baseada na tabela Meta vigente para {COUNTRIES.find(c => c.code === estCountry)?.label} (Marketing R$0,34 · Utility R$0,04). Preços podem variar — confirme em{" "}
                <a href="https://business.facebook.com/billing/payment-settings" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  business.facebook.com
                </a>.
              </p>
            </section>
            )}

            {/* DIAGNÓSTICO */}
            <section className="glass p-5">
              <h2 className="font-semibold flex items-center gap-2"><Activity className="size-4 text-primary" /> Diagnóstico</h2>
              <div className="mt-4 space-y-2.5 text-sm">
                {[
                  ["API Meta",        verify ? (verify.ok ? "Operacional" : "Falha") : (config ? "Configurada" : "Não configurada"), verify ? (verify.ok ? "#00FF88" : "#EF4444") : "#94A3B8"],
                  ["Conta WABA",      account ? verInfo.label : (config?.business_account_id ? "Sincronize" : "WABA ID pendente"), account ? verInfo.color : "#94A3B8"],
                  ["Qualidade",       quality ? qualInfo.label : "—", quality ? qualInfo.color : "#94A3B8"],
                  ["Limite diário",   quality?.messaging_limit_tier ? (TIER_LABEL[quality.messaging_limit_tier] || quality.messaging_limit_tier) : "—", "#94A3B8"],
                  ["Templates",       templates != null ? `${tplApproved} aprovados` : "—", templates != null && tplApproved > 0 ? "#00FF88" : "#94A3B8"],
                  ["Webhook",         config?.webhook_verify_token ? "Configurado" : "Pendente", config?.webhook_verify_token ? "#22D3EE" : "#FBBF24"],
                  ["Última sync",     lastSync ? fmtTime(lastSync) : "Nunca", "#64748B"],
                ].map(([k, v, c]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <span className="text-ink-500 text-xs">{k}</span>
                    <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: c }}>
                      <span className="size-1.5 rounded-full" style={{ background: c }} />{v}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ENVIAR TESTE */}
            {config?.has_token && (
              <section className="glass p-5">
                <h2 className="font-semibold flex items-center gap-2"><Plug className="size-4 text-primary" /> Enviar teste</h2>
                <p className="text-xs text-ink-500 mt-0.5 mb-4">Dispara um template aprovado para validar a operação</p>
                <div className="space-y-3">
                  <Field label="Número destino (com DDI)">
                    <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="5511987654321" />
                  </Field>
                  <Field label="Template aprovado">
                    <select value={testTemplate} onChange={(e) => setTestTemplate(e.target.value)}
                      className="w-full bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none">
                      <option value="">Selecione…</option>
                      {(templates || []).filter((t) => t.status === "APPROVED").map((t) => (
                        <option key={t.id || t.name} value={t.name}>{t.name} ({t.language})</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Variáveis (vírgula)" hint="Ex: João, 20%">
                    <Input value={testVars} onChange={(e) => setTestVars(e.target.value)} placeholder="opcional" />
                  </Field>
                  {testMsg && (
                    <div className={`text-sm rounded-xl px-4 py-2.5 border ${testMsg.ok ? "bg-primary/10 border-primary/25 text-primary" : "bg-red-500/10 border-red-500/25 text-red-300"}`}>
                      {testMsg.text}
                    </div>
                  )}
                  <button onClick={sendTest} disabled={testing || !testTo || !testTemplate}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-bg font-semibold hover:opacity-90 disabled:opacity-50">
                    {testing && <Loader2 className="size-4 animate-spin" />}
                    {testing ? "Enviando…" : "Enviar teste"}
                  </button>
                </div>
              </section>
            )}

            {/* GUIA */}
            <section className="glass overflow-hidden">
              <button onClick={() => setOpenGuide((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 text-left">
                <span className="text-sm font-semibold">Guia de configuração</span>
                <ChevronDown className={`size-4 text-ink-500 transition-transform ${openGuide ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {openGuide && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <div className="px-5 pb-5 space-y-2 border-t border-white/[0.06] pt-4">
                      {STEPS.map((s) => (
                        <div key={s.n} className="flex gap-3">
                          <span className="size-6 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">{s.n}</span>
                          <div>
                            <div className="text-[13px] font-medium text-ink-100">{s.t}</div>
                            <div className="text-[11px] text-ink-500 leading-relaxed mt-0.5">{s.d}</div>
                          </div>
                        </div>
                      ))}
                      <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer"
                        className="inline-block text-[12px] text-primary hover:underline mt-1">Abrir Meta for Developers →</a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>
        </div>
      </div>

      {/* ── MODAIS ── */}
      <AnimatePresence>
        {verifyBlocker && (
          <VerificationModal
            verificationStatus={account?.verification_status}
            onClose={() => setVerifyBlocker(false)}
            onContinue={() => { setVerifyBlocker(false); setModalOpen(true); }}
          />
        )}
        {modalOpen && (
          <CreateTemplateModal
            onClose={() => setModalOpen(false)}
            onCreated={() => { setModalOpen(false); loadTemplates(); loadLogs(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ════════════════ MODAL: CRIAR TEMPLATE ════════════════ */
function CreateTemplateModal({ onClose, onCreated }) {
  const [name, setName]         = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [language, setLanguage] = useState("pt_BR");
  const [header, setHeader]     = useState("");
  const [body, setBody]         = useState("");
  const [footer, setFooter]     = useState("");
  const [btn, setBtn]           = useState("");
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState("");
  const [done, setDone]         = useState(false);

  async function submit() {
    setErr("");
    const safeName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!safeName)    return setErr("Informe um nome para o template");
    if (!body.trim()) return setErr("O corpo da mensagem é obrigatório");
    const components = [];
    if (header.trim()) components.push({ type: "HEADER", format: "TEXT", text: header.trim() });
    components.push({ type: "BODY", text: body.trim() });
    if (footer.trim()) components.push({ type: "FOOTER", text: footer.trim() });
    if (btn.trim())    components.push({ type: "BUTTONS", buttons: [{ type: "QUICK_REPLY", text: btn.trim() }] });
    setBusy(true);
    try {
      await api("/api/wpp-cloud/templates", {
        method: "POST",
        body: { name: safeName, language, category, components },
      });
      setDone(true);
      setTimeout(onCreated, 1200);
    } catch (e) {
      const msg = e.message || "Falha ao enviar para a Meta";
      // Toast amigável se for erro de verificação
      if (/verification/i.test(msg)) {
        setErr("A Meta exige verificação empresarial para criar templates. Complete a verificação em business.facebook.com.");
      } else {
        setErr(msg);
      }
    } finally { setBusy(false); }
  }

  const renderVars = (txt) =>
    String(txt || "").split(/(\{\{\d+\}\})/g).map((p, i) =>
      /^\{\{\d+\}\}$/.test(p)
        ? <span key={i} className="text-emerald-400 font-medium">{p}</span>
        : <span key={i}>{p}</span>
    );

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-[2px]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-3xl rounded-2xl border border-white/[0.08] overflow-hidden"
          style={{ background: "linear-gradient(180deg,#0B1120,#0F172A)", boxShadow: "0 30px 80px -20px rgba(0,0,0,0.85)" }}>
          <div className="flex items-center justify-between px-5 h-14 border-b border-white/[0.06]">
            <h3 className="font-semibold flex items-center gap-2"><LayoutTemplate className="size-4 text-primary" /> Criar template oficial</h3>
            <button onClick={onClose} className="text-ink-500 hover:text-ink-100"><X className="size-5" /></button>
          </div>
          <div className="grid md:grid-cols-2 max-h-[75vh] overflow-y-auto">
            <div className="p-5 space-y-4 border-r border-white/[0.06]">
              <Field label="Nome do template" hint="Só minúsculas, números e _ (ex: boas_vindas)">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="boas_vindas" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Categoria">
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-bg/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                  </select>
                </Field>
                <Field label="Idioma">
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-bg/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none">
                    {["pt_BR", "en_US", "es_ES"].map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Cabeçalho (opcional)">
                <Input value={header} onChange={(e) => setHeader(e.target.value)} placeholder="Ex: Oferta especial 🎉" />
              </Field>
              <Field label="Corpo da mensagem *" hint="Use {{1}}, {{2}} para variáveis">
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4}
                  placeholder="Olá {{1}}! Temos uma condição especial pra você: {{2}} de desconto."
                  className="w-full bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/60 resize-none" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Rodapé (opcional)">
                  <Input value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="Responda PARAR para sair" />
                </Field>
                <Field label="Botão CTA (opcional)">
                  <Input value={btn} onChange={(e) => setBtn(e.target.value)} placeholder="Quero saber mais" />
                </Field>
              </div>
              {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
              <button onClick={submit} disabled={busy || done}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-bg font-semibold hover:opacity-90 disabled:opacity-50">
                {busy && <Loader2 className="size-4 animate-spin" />}
                {done ? "Enviado ✓" : busy ? "Enviando para a Meta…" : "Enviar para aprovação Meta"}
              </button>
              <p className="text-[10px] text-ink-600">Após o envio, a Meta analisa o template (geralmente minutos a 24h).</p>
            </div>
            <div className="p-5 bg-[#0b141a] flex flex-col">
              <div className="text-[11px] uppercase tracking-wider text-ink-500 mb-3">Pré-visualização</div>
              <div className="flex-1 flex items-start">
                <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-[#202c33] px-3 py-2.5 shadow-md text-[#e9edef]">
                  {header && <div className="text-[13px] font-bold mb-1">{renderVars(header)}</div>}
                  <div className="text-[13px] leading-snug whitespace-pre-wrap break-words">
                    {body ? renderVars(body) : <span className="text-ink-500 italic">Corpo da mensagem aparece aqui…</span>}
                  </div>
                  {footer && <div className="text-[11px] text-ink-500 mt-1.5">{footer}</div>}
                  <div className="text-[9px] text-ink-500 text-right mt-1">agora</div>
                  {btn && (
                    <div className="mt-2 -mx-3 -mb-2.5 border-t border-white/10 pt-2 text-center text-[12px] text-[#53bdeb] font-medium">
                      {btn}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
