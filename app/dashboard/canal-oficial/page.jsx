"use client";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, KeyRound, Webhook, LayoutTemplate, BadgeCheck, Activity,
  Search, Plus, Copy, Check, X, Loader2, Gauge, Wallet, Plug, RefreshCw,
  Building2, Zap, AlertTriangle, Clock, BarChart3, FileText, ChevronDown,
} from "lucide-react";
import { api } from "../../../lib/api";
import Topbar from "../../../components/dashboard/Topbar";
import {
  DashButton, DashIconButton, DashBadge, DashModal, DashEmptyState, DashTh,
} from "../../../components/dashboard/DashUI";
import { DASH_ACCENT, dashHeaderIconStyle } from "../../../components/dashboard/dashTheme";

/* Paleta oficial do tema light — nenhuma cor fora daqui. */
const GREEN   = DASH_ACCENT.green;    // #0E8A47 — CTA / sucesso
const EMERALD = DASH_ACCENT.emerald;  // #12A150 — acento desta tela
const AMBER   = DASH_ACCENT.amber;    // #C2740A — atenção / pendente
const RED     = DASH_ACCENT.red;      // #C2434A — erro / rejeitado
const BLUE    = DASH_ACCENT.blue;     // #2F80ED — informativo
const VIOLET  = DASH_ACCENT.violet;   // #6D3BEA — informativo
const SLATE   = DASH_ACCENT.slate;    // #5A6474 — neutro
const FAINT   = "#98A1B0";            // desconhecido

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
  APPROVED: { label: "Aprovado",   color: GREEN },
  PENDING:  { label: "Em análise", color: AMBER },
  REJECTED: { label: "Rejeitado",  color: RED },
  PAUSED:   { label: "Pausado",    color: SLATE },
  DISABLED: { label: "Desativado", color: SLATE },
};
const QUALITY = {
  GREEN:   { label: "Alta",  color: GREEN },
  YELLOW:  { label: "Média", color: AMBER },
  RED:     { label: "Baixa", color: RED },
  UNKNOWN: { label: "—",     color: FAINT },
};
const VERIFICATION = {
  verified:     { label: "Verificada",     color: GREEN },
  not_verified: { label: "Não verificada", color: RED },
  in_review:    { label: "Em análise",     color: AMBER },
  rejected:     { label: "Rejeitada",      color: RED },
};
const TIER_LABEL = {
  TIER_250:      "250 / dia",
  TIER_500:      "500 / dia",
  TIER_1K:       "1.000 / dia",
  TIER_2K:       "2.000 / dia",
  TIER_10K:      "10.000 / dia",
  TIER_100K:     "100.000 / dia",
  TIER_UNLIMITED:"Ilimitado",
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
  sync:             { label: "Sincronização", icon: RefreshCw, color: BLUE },
  template_created: { label: "Template criado", icon: LayoutTemplate, color: VIOLET },
  template_rejected:{ label: "Template rejeitado", icon: X, color: RED },
  webhook_validated:{ label: "Webhook validado", icon: Webhook, color: GREEN },
  token_updated:    { label: "Token atualizado", icon: KeyRound, color: AMBER },
  test_sent:        { label: "Teste enviado", icon: Plug, color: EMERALD },
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
function Dot({ color, className = "" }) {
  return <span className={`size-1.5 rounded-full shrink-0 ${className}`} style={{ background: color }} />;
}

function StatusCard({ icon: Icon, label, value, tint, sub, tooltip }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      title={tooltip}
      className="dash-card !p-4 cursor-default"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] text-dash-faint">{label}</div>
          <div className="text-[15px] font-bold mt-1.5 truncate" style={{ color: tint }}>{value}</div>
          {sub && <div className="text-[10px] text-dash-faint2 mt-0.5 truncate">{sub}</div>}
        </div>
        <span className="shrink-0" style={dashHeaderIconStyle(tint)}>
          <Icon width={16} height={16} />
        </span>
      </div>
    </motion.div>
  );
}

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-[11px] text-dash-faint2 uppercase tracking-wider mb-1.5 font-semibold">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-dash-faint mt-1">{hint}</p>}
  </div>
);
const Input = ({ type = "text", className = "", ...p }) => (
  <input type={type} className={`dash-input ${className}`} {...p} />
);
const Select = ({ className = "", ...p }) => (
  <select className={`dash-input appearance-none cursor-pointer ${className}`} {...p} />
);
function Skel({ className = "" }) {
  return <div className={`dash-skeleton ${className}`} />;
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
    score >= 70 ? { label: "Saudável", color: GREEN } :
    score >= 40 ? { label: "Atenção",  color: AMBER } :
                  { label: "Crítico",  color: RED };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="dash-card !p-5"
      style={{ borderColor: `${scoreLevel.color}33`, background: `${scoreLevel.color}08` }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Score gauge */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <div className="relative size-20">
            <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#E9ECF1" strokeWidth="6" />
              <circle cx="40" cy="40" r="32" fill="none" stroke={scoreLevel.color} strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${Math.round(score * 2.01)} 201`}
                style={{ transition: "stroke-dasharray 0.8s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black leading-none" style={{ color: scoreLevel.color }}>{Math.round(score)}</span>
              <span className="text-[9px] text-dash-faint2">/ 100</span>
            </div>
          </div>
          <span className="text-[11px] font-semibold" style={{ color: scoreLevel.color }}>{scoreLevel.label}</span>
        </div>

        {/* Checklist */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="m-0 font-semibold text-sm text-dash-ink">Saúde da Conta</h2>
            <span className="font-mono text-[10px] text-dash-faint2">Score {Math.round(score)}/100</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {checks.map((c) => {
              const color = c.ok ? GREEN : c.warn ? AMBER : RED;
              return (
                <div key={c.key} className="flex items-center gap-2 text-[12px]" title={c.detail}>
                  <span className="size-4 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold"
                    style={{ background: `${color}1f`, color }}>
                    {c.ok ? "✓" : c.warn ? "~" : "✕"}
                  </span>
                  <span style={{ color: c.ok ? "#26303E" : color }}>{c.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ── Verification blocker modal ── */
function VerificationModal({ open, verificationStatus, onContinue, onClose }) {
  return (
    <DashModal
      open={open}
      onClose={onClose}
      title="Conta Meta ainda não verificada"
      subtitle="Para criar templates oficiais a Meta exige que sua conta empresarial esteja verificada."
      footer={
        <>
          <a href="https://business.facebook.com/settings/security" target="_blank" rel="noreferrer"
            className="dash-btn-secondary">Como verificar →</a>
          <DashButton variant="primary" onClick={onContinue}>Continuar mesmo assim</DashButton>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span className="shrink-0" style={{ ...dashHeaderIconStyle(AMBER), width: 40, height: 40, borderRadius: 13 }}>
          <AlertTriangle width={19} height={19} />
        </span>
        <p className="text-[13px] text-dash-muted leading-relaxed m-0">
          {verificationStatus === "in_review" && "Sua conta está em análise. "}
          {verificationStatus === "not_verified" && "Complete a verificação no Business Manager. "}
          Enquanto isso, a Meta pode recusar novos templates.
        </p>
      </div>

      <div className="p-4 rounded-[14px] bg-dash-subtle border border-dash-border text-xs text-dash-muted leading-relaxed">
        <p className="font-semibold text-dash-ink mb-1.5">Como verificar sua conta:</p>
        <ol className="space-y-1 list-decimal list-inside m-0">
          <li>Acesse <a href="https://business.facebook.com" target="_blank" rel="noreferrer" className="font-semibold hover:underline" style={{ color: GREEN }}>business.facebook.com</a></li>
          <li>Vá em Configurações → Central de Segurança</li>
          <li>Clique em "Iniciar verificação" e siga os passos</li>
        </ol>
      </div>
    </DashModal>
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

  const loadVerify = useCallback(() => {
    if (!config?.has_token) return;
    api("/api/wpp-cloud/verify")
      .then((r) => setVerify(r))
      .catch(() => setVerify({ ok: false }));
  }, [config]);

  const loadLogs = useCallback(() => {
    api("/api/wpp-cloud/logs").then(setLogs).catch(() => setLogs([]));
  }, []);

  useEffect(() => {
    if (!config) return;
    loadTemplates();
    loadAccount();
    loadQuality();
    loadVerify();
    loadLogs();
  }, [config, loadTemplates, loadAccount, loadQuality, loadVerify, loadLogs]);

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
      // Cada template só existe no idioma em que foi aprovado (ex: hello_world é en_US,
      // não pt_BR) — manda o idioma real do template escolhido, não o default do backend.
      const language = templates?.find((t) => t.name === testTemplate)?.language;
      const r = await api("/api/wpp-cloud/test", {
        method: "POST",
        body: { to: testTo.trim(), template: testTemplate, language, variables },
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
  const verInfo   = VERIFICATION[verStatus] || { label: "—", color: FAINT };
  const qualInfo  = QUALITY[quality?.quality_rating || "UNKNOWN"];
  const tplApproved  = templates ? templates.filter(t => t.status === "APPROVED").length  : null;
  const tplPending   = templates ? templates.filter(t => t.status === "PENDING").length   : null;
  const tplRejected  = templates ? templates.filter(t => t.status === "REJECTED").length  : null;

  const statusCards = [
    {
      icon: Plug, label: "API Oficial",
      value: connected ? "Conectada" : "Não configurada",
      tint: connected ? GREEN : AMBER,
      sub: config?.verified_name || (connected ? "Sistema User ativo" : "configure abaixo"),
      tooltip: "Status da conexão com a API Cloud da Meta",
    },
    {
      icon: KeyRound, label: "Token de acesso",
      value: config?.has_token ? "Configurado" : "Ausente",
      tint: config?.has_token ? GREEN : RED,
      sub: config?.has_token ? "System User permanente" : "obrigatório",
      tooltip: "Access Token do System User — nunca expira se configurado como permanente",
    },
    {
      icon: Webhook, label: "Webhook",
      value: config?.webhook_verify_token ? "Configurado" : "Pendente",
      tint: config?.webhook_verify_token ? BLUE : AMBER,
      sub: "verify token por tenant",
      tooltip: "Cada conta tem seu próprio verify token — seguro e isolado",
    },
    {
      icon: LayoutTemplate, label: "Templates",
      value: templates == null ? "—" : `${templates.length} total`,
      tint: VIOLET,
      sub: templates != null ? `${tplApproved} aprovados · ${tplPending} pendentes · ${tplRejected} rejeitados` : "sincronize para ver",
      tooltip: "Templates oficiais sincronizados da WABA",
    },
    {
      icon: Building2, label: "Conta Meta",
      value: account?._error ? "Sem permissão" : account ? verInfo.label : (config?.business_account_id ? "Carregando…" : "—"),
      tint: account?._error ? RED : verInfo.color,
      sub: account?._error ? "Token sem whatsapp_business_management" : (account?.name || "empresa vinculada"),
      tooltip: account?._error ? account._error : "Status de verificação empresarial da Meta",
    },
    {
      icon: Gauge, label: "Qualidade",
      value: quality?._error ? "Sem permissão" : quality ? qualInfo.label : "—",
      tint: quality?._error ? RED : qualInfo.color,
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
      <div className="page-x space-y-4">
        <Skel className="h-28 !rounded-[20px]" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skel key={i} className="h-24 !rounded-[20px]" />)}
        </div>
      </div>
    </>
  );

  /* ── sync button para topbar ── */
  const syncBtn = connected ? (
    <DashButton variant="secondary" onClick={syncAll} disabled={syncing}>
      {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
      {syncing ? "Sincronizando…" : "Sincronizar Meta"}
    </DashButton>
  ) : null;

  return (
    <>
      <Topbar
        title="Canal Oficial"
        subtitle={lastSync ? `Última sync: ${fmtTime(lastSync)}` : "Central operacional da API oficial do WhatsApp (Meta)"}
        actions={syncBtn}
      />
      <div className="page-x space-y-6">

        {/* ── HEALTH SCORE ── */}
        <HealthScore config={config} account={account} quality={quality} templates={templates} verify={verify} />

        {/* ── STATUS CARDS ── */}
        <section className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {statusCards.map((c, i) => <StatusCard key={i} {...c} />)}
        </section>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="space-y-6 min-w-0">

            {/* ── TABS: Templates | Logs ── */}
            <div className="flex items-center gap-1 border-b border-dash-border2">
              {[
                { k: "templates", label: "Templates", icon: LayoutTemplate },
                { k: "logs",      label: "Logs",      icon: FileText },
              ].map(({ k, label, icon: Icon }) => (
                <button
                  key={k}
                  onClick={() => { setMainTab(k); if (k === "logs") loadLogs(); }}
                  className={`relative flex items-center gap-1.5 px-4 py-2.5 text-[13px] transition-colors ${
                    mainTab === k ? "text-dash-ink font-semibold" : "text-dash-faint font-medium hover:text-dash-ink2"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                  {mainTab === k && (
                    <motion.span layoutId="canal-tab" className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full"
                      style={{ background: EMERALD }} />
                  )}
                </button>
              ))}
            </div>

            {/* ── TAB: TEMPLATES ── */}
            <AnimatePresence mode="wait">
              {mainTab === "templates" && (
                <motion.section key="tpl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="dash-card">
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                    <div>
                      <h2 className="m-0 text-base font-semibold text-dash-ink">Templates oficiais</h2>
                      <p className="text-xs text-dash-faint mt-0.5">Sincronizados da sua conta WhatsApp Business (Meta)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {templates != null && (
                        <div className="flex items-center gap-3 text-[11px] text-dash-muted">
                          <span className="flex items-center gap-1.5"><Dot color={GREEN} />{tplApproved} aprovados</span>
                          <span className="flex items-center gap-1.5"><Dot color={AMBER} />{tplPending} pendentes</span>
                          <span className="flex items-center gap-1.5"><Dot color={RED} />{tplRejected} rejeitados</span>
                        </div>
                      )}
                      <DashIconButton onClick={loadTemplates} title="Sincronizar templates">
                        <RefreshCw width={15} height={15} />
                      </DashIconButton>
                      <DashButton onClick={handleNewTemplate}>
                        <Plus className="size-4" /> Novo Template
                      </DashButton>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dash-placeholder pointer-events-none" />
                      <input value={tplQ} onChange={(e) => setTplQ(e.target.value)} placeholder="Buscar template…"
                        className="dash-input !pl-9" />
                    </div>
                    <Select value={tplCat} onChange={(e) => setTplCat(e.target.value)} className="!w-auto">
                      <option value="">Categoria</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                    </Select>
                    <Select value={tplStatus} onChange={(e) => setTplStatus(e.target.value)} className="!w-auto">
                      <option value="">Status</option>
                      {Object.entries(TPL_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </Select>
                  </div>

                  {templates == null ? (
                    <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skel key={i} className="h-12" />)}</div>
                  ) : !config?.has_token ? (
                    <DashEmptyState
                      icon={LayoutTemplate} accent={EMERALD}
                      title="Sem credenciais Meta"
                      desc="Configure as credenciais Meta para sincronizar seus templates."
                    />
                  ) : filteredTpls.length === 0 ? (
                    <DashEmptyState
                      icon={LayoutTemplate} accent={EMERALD}
                      title="Nenhum template encontrado"
                      desc="Crie um template oficial e envie para aprovação da Meta."
                      cta={!tplQ && !tplCat && !tplStatus ? { label: "Criar primeiro template", icon: Plus, onClick: handleNewTemplate } : undefined}
                    />
                  ) : (
                    <div className="overflow-x-auto -mx-1">
                      <table className="w-full text-sm min-w-[620px]">
                        <thead>
                          <tr className="text-left">
                            <th className="dash-th">Nome</th>
                            <th className="dash-th">Categoria</th>
                            <th className="dash-th">Status</th>
                            <th className="dash-th">Qualidade</th>
                            <th className="dash-th">Idioma</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dash-border2">
                          {filteredTpls.map((t) => {
                            const st = TPL_STATUS[t.status] || { label: t.status || "—", color: SLATE };
                            const ql = QUALITY[(t.quality_score?.score || "UNKNOWN").toUpperCase()] || QUALITY.UNKNOWN;
                            return (
                              <tr key={t.id || t.name} className="hover:bg-dash-subtle transition-colors">
                                <td className="px-4 py-3 font-medium text-dash-ink truncate max-w-[220px]">{t.name}</td>
                                <td className="px-4 py-3 text-dash-muted">{CAT_LABEL[t.category] || t.category || "—"}</td>
                                <td className="px-4 py-3">
                                  <DashBadge color={st.color}>{st.label}</DashBadge>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: ql.color }}>
                                    <Dot color={ql.color} />{ql.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-dash-faint uppercase text-[12px]">{t.language || "—"}</td>
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
                  className="dash-card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="m-0 text-base font-semibold text-dash-ink flex items-center gap-2">
                        <FileText className="size-4" style={{ color: EMERALD }} /> Logs de eventos
                      </h2>
                      <p className="text-xs text-dash-faint mt-0.5">Histórico das ações do Canal Oficial</p>
                    </div>
                    <DashIconButton onClick={loadLogs} title="Recarregar logs">
                      <RefreshCw width={15} height={15} />
                    </DashIconButton>
                  </div>

                  {logs == null ? (
                    <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skel key={i} className="h-12" />)}</div>
                  ) : logs.length === 0 ? (
                    <DashEmptyState
                      icon={Clock} accent={SLATE}
                      title="Nenhum evento registrado"
                      desc="Ações como sincronizações e criação de templates aparecem aqui."
                    />
                  ) : (
                    <div className="space-y-1">
                      {logs.map((log) => {
                        const meta = LOG_LABELS[log.action] || { label: log.action, icon: Activity, color: SLATE };
                        const Icon = meta.icon;
                        const resColor = log.result === "ok" ? GREEN : RED;
                        return (
                          <div key={log.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-[13px] hover:bg-dash-subtle transition-colors">
                            <span className="size-7 rounded-[9px] flex items-center justify-center border shrink-0"
                              style={{ background: `${meta.color}14`, borderColor: `${meta.color}33` }}>
                              <Icon className="size-3.5" style={{ color: meta.color }} />
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-medium text-dash-ink">{meta.label}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                                  style={{ background: `${resColor}14`, color: resColor }}>
                                  {log.result === "ok" ? "✓ ok" : "✕ erro"}
                                </span>
                              </div>
                              {log.error_msg && <p className="text-[11px] truncate" style={{ color: RED }}>{log.error_msg}</p>}
                              {log.details && !log.error_msg && (
                                <p className="text-[11px] text-dash-faint truncate">
                                  {log.details.synced ? `Sincronizou: ${log.details.synced.join(", ")}` :
                                   log.details.name   ? `Template: ${log.details.name}` : JSON.stringify(log.details).slice(0, 80)}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] text-dash-faint2 shrink-0">{fmtTime(log.created_at)}</span>
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
              <section className="rounded-[16px] px-5 py-4 flex gap-3"
                style={{ background: `${AMBER}0f`, border: `1px solid ${AMBER}33` }}>
                <AlertTriangle className="size-5 shrink-0 mt-0.5" style={{ color: AMBER }} />
                <div>
                  <p className="text-sm font-semibold m-0" style={{ color: AMBER }}>Configure aqui primeiro, depois vá ao Meta</p>
                  <p className="text-xs text-dash-muted leading-relaxed mt-1 m-0">
                    Preencha o formulário abaixo e clique em <strong className="text-dash-ink">Salvar e validar</strong>.
                    Só depois acesse o painel do Meta → WhatsApp → Configuração → Webhooks e cole a URL e o Verify Token.
                  </p>
                </div>
              </section>
            )}

            {/* ── CREDENCIAIS ── */}
            <section className="dash-card">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
                <div>
                  <h2 className="m-0 text-base font-semibold text-dash-ink flex items-center gap-2">
                    <KeyRound className="size-4" style={{ color: EMERALD }} /> Credenciais Meta
                  </h2>
                  <p className="text-xs text-dash-faint mt-0.5">Validadas com a Meta antes de salvar</p>
                </div>
                {config && (
                  <div className="flex items-center gap-2">
                    {config?.has_token && (
                      <DashButton variant="secondary" onClick={testConnection} disabled={testingConn}>
                        {testingConn ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />} Testar conexão
                      </DashButton>
                    )}
                    {confirmDisconnect ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: RED }}>Remover configuração?</span>
                        <DashButton variant="danger" onClick={disconnect} className="!px-3 !py-2 !text-xs">Sim</DashButton>
                        <DashButton variant="secondary" onClick={() => setConfirmDisconnect(false)} className="!px-3 !py-2 !text-xs">Não</DashButton>
                      </div>
                    ) : (
                      <DashButton variant="danger" onClick={() => setConfirmDisconnect(true)}>
                        <X className="size-4" /> Remover
                      </DashButton>
                    )}
                  </div>
                )}
              </div>

              {verify && (
                <div className="mb-4 text-sm rounded-[13px] px-4 py-3 font-medium"
                  style={verify.ok
                    ? { background: `${GREEN}0f`, border: `1px solid ${GREEN}33`, color: GREEN }
                    : { background: `${RED}0f`, border: `1px solid ${RED}33`, color: RED }}>
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
                      <DashButton type="button" variant="secondary" onClick={copyVerifyToken} disabled={!verifyToken.trim()} className="!px-3 shrink-0">
                        {copiedToken ? <Check className="size-3.5" style={{ color: GREEN }} /> : <Copy className="size-3.5" />}
                        {copiedToken ? "Copiado" : "Copiar"}
                      </DashButton>
                    </div>
                  </Field>
                  <Field label="App Secret (opcional)" hint="Valida HMAC do webhook">
                    <Input type="password" value={appSecret} onChange={(e) => setAppSecret(e.target.value)}
                      placeholder={config?.has_app_secret ? "•••••••• (preencha p/ atualizar)" : "Do painel do app Meta"} />
                  </Field>
                </div>
                <Field label="URL do Webhook">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-dash-subtle border border-dash-input rounded-[13px] px-4 py-2.5 break-all font-mono"
                      style={{ color: EMERALD }}>{WEBHOOK_URL}</code>
                    <DashButton type="button" variant="secondary" onClick={copyWebhook} className="!px-3 shrink-0">
                      {copied ? <Check className="size-3.5" style={{ color: GREEN }} /> : <Copy className="size-3.5" />} {copied ? "Copiado" : "Copiar"}
                    </DashButton>
                  </div>
                </Field>
                {config?.webhook_verify_token && (
                  <div className="rounded-[13px] px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
                    style={{ background: `${BLUE}0f`, border: `1px solid ${BLUE}33` }}>
                    <div>
                      <p className="text-[10px] text-dash-faint2 uppercase tracking-wider mb-0.5 font-semibold">Token salvo no banco (use este no Meta)</p>
                      <code className="text-[13px] font-bold font-mono" style={{ color: BLUE }}>{config.webhook_verify_token}</code>
                    </div>
                    <DashButton type="button" variant="secondary" className="!px-3 !py-1.5 !text-xs shrink-0"
                      onClick={() => { navigator.clipboard?.writeText(config.webhook_verify_token); setCopiedToken(true); setTimeout(() => setCopiedToken(false), 1500); }}>
                      {copiedToken ? <Check className="size-3.5" style={{ color: BLUE }} /> : <Copy className="size-3.5" />} {copiedToken ? "Copiado" : "Copiar"}
                    </DashButton>
                  </div>
                )}
                {err && <div className="text-sm rounded-[13px] px-4 py-3" style={{ color: RED, background: `${RED}0f`, border: `1px solid ${RED}29` }}>{err}</div>}
                {ok  && <div className="text-sm rounded-[13px] px-4 py-3" style={{ color: GREEN, background: `${GREEN}0f`, border: `1px solid ${GREEN}29` }}>{ok}</div>}
                <DashButton type="submit" loading={saving}>
                  {saving ? "Validando com a Meta…" : "Salvar e validar"}
                </DashButton>
              </form>
            </section>
          </div>

          {/* ── COLUNA DIREITA ── */}
          <div className="space-y-6">

            {/* CONTA META — detalhes */}
            {(account || config?.business_account_id) && (
              <section className="dash-card">
                <h2 className="m-0 text-base font-semibold text-dash-ink flex items-center gap-2 mb-4">
                  <Building2 className="size-4" style={{ color: EMERALD }} /> Conta Meta
                </h2>
                <div className="space-y-3">
                  {account ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-dash-faint">Empresa</span>
                        <span className="text-xs font-semibold text-dash-ink">{account.name || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-dash-faint">Verificação</span>
                        <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: verInfo.color }}>
                          <Dot color={verInfo.color} />
                          {verInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-dash-faint">WABA ID</span>
                        <code className="text-[11px] text-dash-muted font-mono">{account.id || config?.business_account_id}</code>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skel key={i} className="h-5" />)}</div>
                  )}
                  {quality && (
                    <div className="border-t border-dash-border2 pt-3">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-xs text-dash-faint">Qualidade</span>
                        <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: qualInfo.color }}>
                          <Dot color={qualInfo.color} /> {qualInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-dash-faint">Limite diário</span>
                        <span className="text-xs font-semibold text-dash-ink">
                          {quality.messaging_limit_tier ? (TIER_LABEL[quality.messaging_limit_tier] || quality.messaging_limit_tier) : "—"}
                        </span>
                      </div>
                    </div>
                  )}
                  <DashButton variant="secondary" onClick={() => { loadAccount(); loadQuality(); }} className="w-full !text-xs mt-1">
                    <RefreshCw className="size-3.5" /> Atualizar status
                  </DashButton>
                </div>
              </section>
            )}

            {/* ESTIMATIVA DE CUSTOS — oculta do cliente final por enquanto (trocar para true p/ reexibir) */}
            {false && (
            <section className="dash-card">
              <h2 className="m-0 text-base font-semibold text-dash-ink flex items-center gap-2">
                <Wallet className="size-4" style={{ color: EMERALD }} /> Estimativa de custos
              </h2>
              <p className="text-xs text-dash-faint mt-0.5 mb-4">Projeção por volume diário de conversas</p>
              <div className="space-y-3">
                <Field label="País">
                  <Select value={estCountry} onChange={(e) => setEstCountry(e.target.value)}>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </Select>
                </Field>
                <Field label="Categoria">
                  <Select value={estCat} onChange={(e) => setEstCat(e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                  </Select>
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
                  <div key={k} className="rounded-[13px] border border-dash-border bg-dash-subtle p-3">
                    <div className="text-[10px] text-dash-faint2 uppercase tracking-wide font-semibold">{k}</div>
                    <div className="text-base font-bold mt-0.5" style={{ color: GREEN }}>{v}</div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-dash-faint2 mt-3 leading-relaxed">
                Estimativa baseada na tabela Meta vigente para {COUNTRIES.find(c => c.code === estCountry)?.label} (Marketing R$0,34 · Utility R$0,04). Preços podem variar — confirme em{" "}
                <a href="https://business.facebook.com/billing/payment-settings" target="_blank" rel="noreferrer" className="font-semibold hover:underline" style={{ color: GREEN }}>
                  business.facebook.com
                </a>.
              </p>
            </section>
            )}

            {/* DIAGNÓSTICO */}
            <section className="dash-card">
              <h2 className="m-0 text-base font-semibold text-dash-ink flex items-center gap-2">
                <Activity className="size-4" style={{ color: EMERALD }} /> Diagnóstico
              </h2>
              <div className="mt-4 space-y-2.5 text-sm">
                {[
                  ["API Meta",        verify ? (verify.ok ? "Operacional" : "Falha") : (config ? "Configurada" : "Não configurada"), verify ? (verify.ok ? GREEN : RED) : FAINT],
                  ["Conta WABA",      account ? verInfo.label : (config?.business_account_id ? "Sincronize" : "WABA ID pendente"), account ? verInfo.color : FAINT],
                  ["Qualidade",       quality ? qualInfo.label : "—", quality ? qualInfo.color : FAINT],
                  ["Limite diário",   quality?.messaging_limit_tier ? (TIER_LABEL[quality.messaging_limit_tier] || quality.messaging_limit_tier) : "—", FAINT],
                  ["Templates",       templates != null ? `${tplApproved} aprovados` : "—", templates != null && tplApproved > 0 ? GREEN : FAINT],
                  ["Webhook",         config?.webhook_verify_token ? "Configurado" : "Pendente", config?.webhook_verify_token ? BLUE : AMBER],
                  ["Última sync",     lastSync ? fmtTime(lastSync) : "Nunca", SLATE],
                ].map(([k, v, c]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <span className="text-dash-faint text-xs">{k}</span>
                    <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: c }}>
                      <Dot color={c} />{v}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ENVIAR TESTE */}
            {config?.has_token && (
              <section className="dash-card">
                <h2 className="m-0 text-base font-semibold text-dash-ink flex items-center gap-2">
                  <Plug className="size-4" style={{ color: EMERALD }} /> Enviar teste
                </h2>
                <p className="text-xs text-dash-faint mt-0.5 mb-4">Dispara um template aprovado para validar a operação</p>
                <div className="space-y-3">
                  <Field label="Número destino (com DDI)">
                    <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="5511987654321" />
                  </Field>
                  <Field label="Template aprovado">
                    <Select value={testTemplate} onChange={(e) => setTestTemplate(e.target.value)}>
                      <option value="">Selecione…</option>
                      {(templates || []).filter((t) => t.status === "APPROVED").map((t) => (
                        <option key={t.id || t.name} value={t.name}>{t.name} ({t.language})</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Variáveis (vírgula)" hint="Ex: João, 20%">
                    <Input value={testVars} onChange={(e) => setTestVars(e.target.value)} placeholder="opcional" />
                  </Field>
                  {testMsg && (
                    <div className="text-sm rounded-[13px] px-4 py-2.5 font-medium"
                      style={testMsg.ok
                        ? { background: `${GREEN}0f`, border: `1px solid ${GREEN}33`, color: GREEN }
                        : { background: `${RED}0f`, border: `1px solid ${RED}33`, color: RED }}>
                      {testMsg.text}
                    </div>
                  )}
                  <DashButton onClick={sendTest} loading={testing} disabled={testing || !testTo || !testTemplate} className="w-full">
                    {testing ? "Enviando…" : "Enviar teste"}
                  </DashButton>
                </div>
              </section>
            )}

            {/* GUIA */}
            <section className="dash-card-flush">
              <button onClick={() => setOpenGuide((v) => !v)}
                className="w-full flex items-center justify-between px-6 py-4 text-left">
                <span className="text-sm font-semibold text-dash-ink">Guia de configuração</span>
                <ChevronDown className={`size-4 text-dash-faint transition-transform ${openGuide ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {openGuide && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <div className="px-6 pb-6 space-y-3 border-t border-dash-border2 pt-4">
                      {STEPS.map((s) => (
                        <div key={s.n} className="flex gap-3">
                          <span className="size-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0"
                            style={{ background: `${EMERALD}1a`, color: EMERALD }}>{s.n}</span>
                          <div>
                            <div className="text-[13px] font-medium text-dash-ink">{s.t}</div>
                            <div className="text-[11.5px] text-dash-faint leading-relaxed mt-0.5">{s.d}</div>
                          </div>
                        </div>
                      ))}
                      <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer"
                        className="inline-block text-[12px] font-semibold hover:underline mt-1" style={{ color: GREEN }}>Abrir Meta for Developers →</a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>
        </div>
      </div>

      {/* ── MODAIS ── */}
      <VerificationModal
        open={verifyBlocker}
        verificationStatus={account?.verification_status}
        onClose={() => setVerifyBlocker(false)}
        onContinue={() => { setVerifyBlocker(false); setModalOpen(true); }}
      />
      <CreateTemplateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => { setModalOpen(false); loadTemplates(); loadLogs(); }}
      />
    </>
  );
}

/* ════════════════ MODELOS PRONTOS ════════════════ */
const PRESETS = [
  {
    label: "Convite Teste de Visão",
    tag: "UTILITY",
    tagColor: BLUE,
    hint: "~R$ 0,04/conversa",
    name: "convite_teste_visao_cliente",
    category: "UTILITY",
    language: "pt_BR",
    header: "Teste de Visao Gratuito",
    body: `Olá, {{1}}! 👓\n\nComo você já é cliente da Ótica Visão de Todos, liberamos um convite especial para realizar um teste de visão gratuito aqui na loja.\n\nNão deixe para depois algo tão importante quanto a sua visão. 💙\n\nQuer agendar o seu teste?\n\n📍 R. Timbiras, 618 – Vila Tupi`,
    footer: "",
    btn: "QUERO AGENDAR",
  },
  {
    label: "Teste de Visao – Cliente",
    tag: "UTILITY",
    tagColor: BLUE,
    hint: "~R$ 0,04/conversa",
    name: "teste_visao_cliente",
    category: "UTILITY",
    language: "pt_BR",
    header: "",
    body: `Oi, {{1}}! 👓\n\nComo voce ja e nosso cliente, seu teste de visao esta disponivel para agendamento aqui na Otica Visao de Todos.\n\nE so nos confirmar o melhor dia e horario para voce.\n\n📍 R. Timbiras, 618 – Vila Tupi`,
    footer: "",
    btn: "Quero agendar",
  },
  {
    label: "Agendamento Consulta Opto",
    tag: "UTILITY",
    tagColor: BLUE,
    hint: "~R$ 0,04/conversa",
    name: "agendamento_consulta_opto",
    category: "UTILITY",
    language: "pt_BR",
    header: "",
    body: `Oi, {{1}}! 👓\n\nNossa agenda de teste de visao esta aberta para essa semana.\n\nO teste e realizado aqui na loja pelo nosso optometrista e nao tem custo.\n\nSe quiser reservar um horario, e so responder com o dia de sua preferencia.\n\n🗓 Seg a Sex: 9h as 18h\n🗓 Sabado: 9h as 13h\n\n📍 Otica Visao de Todos · R. Timbiras, 618`,
    footer: "",
    btn: "Quero agendar",
  },
  {
    label: "Suporte Pos Consulta",
    tag: "UTILITY",
    tagColor: BLUE,
    hint: "~R$ 0,04/conversa",
    name: "suporte_pos_consulta_visao",
    category: "UTILITY",
    language: "pt_BR",
    header: "",
    body: `Oi, {{1}}! 😊\n\nVi que voce passou na AmorSaude hoje.\n\nSe o Dr. Leonardo atualizou sua receita e tiver alguma duvida, e so me chamar — estou aqui do lado na Otica Visao de Todos.\n\n📍 R. Timbiras, 618`,
    footer: "",
    btn: "Falar agora",
  },
  {
    label: "Oculos 12 Meses – Boa Noticia",
    tag: "UTILITY",
    tagColor: BLUE,
    hint: "~R$ 0,04/conversa",
    name: "oculos_12_meses_boa_noticia",
    category: "UTILITY",
    language: "pt_BR",
    header: "",
    body: `Oi, {{1}}! 👓\n\nSe seus oculos tem mais de 12 meses, tenho uma boa noticia para voce.\n\nClique no botao abaixo para saber mais 👇`,
    footer: "Otica Visao de Todos · R. Timbiras, 618",
    btn: "Saber mais",
  },
  {
    label: "Renovacao de Receita",
    tag: "UTILITY",
    tagColor: BLUE,
    hint: "~R$ 0,04/conversa",
    name: "renovacao_receita_oculos",
    category: "UTILITY",
    language: "pt_BR",
    header: "",
    body: `Oi, {{1}}!\n\nReceitas de oculos tem prazo de validade de 12 meses. Se a sua esta proxima do vencimento ou ja venceu, e hora de fazer a revisao.\n\nNosso optometrista esta com horario disponivel essa semana aqui na Otica Visao de Todos.\n\nQuer reservar o seu?\n\n📍 R. Timbiras, 618 – Vila Tupi`,
    footer: "",
    btn: "Reservar horario",
  },
  {
    label: "Oportunidade Exclusiva",
    tag: "MARKETING",
    tagColor: AMBER,
    hint: "~R$ 0,34/conversa",
    name: "oportunidade_renovar_receita",
    category: "MARKETING",
    language: "pt_BR",
    header: "",
    body: `Oi, {{1}}! 👓\n\nTemos uma oportunidade exclusiva para voce renovar sua receita aqui na Otica Visao de Todos.\n\nNosso optometrista esta disponivel para te atender com hora marcada — sem fila, sem espera.\n\nSo nos chamar e garantir o seu horario!\n\n📍 R. Timbiras, 618 – Vila Tupi`,
    footer: "",
    btn: "Quero meu horario",
  },
  {
    label: "Dia do Cliente – Ótica",
    tag: "MARKETING",
    tagColor: AMBER,
    hint: "~R$ 0,34/conversa",
    name: "dia_do_cliente_otica",
    category: "MARKETING",
    language: "pt_BR",
    header: "Condição Especial pra Você! 🎉",
    body: `Olá, {{1}}! 👓\n\nHoje tem consulta com o Dr. Leonardo na AmorSaúde? Se ele atualizar sua receita, *não vá embora sem conferir nossa promoção!* 💙\n\n📍 A Ótica Visão de Todos fica bem em frente — terminou a consulta, é só atravessar a rua!\n\nSomos parceiros do Cartão de Todos, com condições especiais para nossos clientes. 🔥`,
    footer: "Ótica Visão de Todos · R. Timbiras, 618",
    btn: "Quero saber mais",
  },
];

/* ════════════════ MODAL: CRIAR TEMPLATE ════════════════ */
function CreateTemplateModal({ open, onClose, onCreated }) {
  const [name, setName]         = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [language, setLanguage] = useState("pt_BR");
  const [headerType, setHeaderType] = useState("TEXT"); // TEXT | IMAGE | VIDEO | DOCUMENT | NONE
  const [header, setHeader]     = useState("");
  const [body, setBody]         = useState("");
  const [footer, setFooter]     = useState("");
  const [btn, setBtn]           = useState("");
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState("");
  const [done, setDone]         = useState(false);
  const [mediaFile, setMediaFile]   = useState(null);   // { file, previewUrl }
  const [mediaUrl, setMediaUrl]     = useState(null);   // URL pública no Supabase
  const [uploading, setUploading]   = useState(false);
  const mediaInputRef = useRef(null);

  function loadPreset(p) {
    setName(p.name);
    setCategory(p.category);
    setLanguage(p.language);
    setHeaderType(p.header ? "TEXT" : "NONE");
    setHeader(p.header);
    setBody(p.body);
    setFooter(p.footer);
    setBtn(p.btn);
    setMediaFile(null);
    setMediaUrl(null);
    setErr("");
  }

  async function handleMediaSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile({ file, previewUrl: URL.createObjectURL(file) });
    setMediaUrl(null);
    setErr("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await api("/api/wpp-cloud/upload-media", { method: "POST", body: form, rawBody: true });
      setMediaUrl(r.url);
    } catch (e) {
      setErr("Erro ao fazer upload da mídia: " + (e.message || "tente novamente"));
      setMediaFile(null);
    } finally { setUploading(false); }
  }

  async function submit() {
    setErr("");
    const safeName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!safeName)    return setErr("Informe um nome para o template");
    if (!body.trim()) return setErr("O corpo da mensagem é obrigatório");
    if (["IMAGE","VIDEO","DOCUMENT"].includes(headerType) && uploading) {
      return setErr("Aguarde o upload da mídia finalizar");
    }
    const components = [];
    if (headerType === "TEXT" && header.trim()) {
      // Header TEXT não aceita emojis, asteriscos nem formatação
      const safeHeader = header.trim().replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}*_~]/gu, "").trim();
      if (!safeHeader) return setErr("O cabeçalho não pode conter apenas emojis — escreva um texto sem emojis");
      components.push({ type: "HEADER", format: "TEXT", text: safeHeader });
    } else if (["IMAGE","VIDEO","DOCUMENT"].includes(headerType)) {
      components.push({ type: "HEADER", format: headerType });
    }
    // Detecta variáveis {{1}}, {{2}}... e gera example.body_text com valores de exemplo
    const bodyVars = [...body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => parseInt(m[1]));
    const maxVar = bodyVars.length ? Math.max(...bodyVars) : 0;
    const bodyComp = { type: "BODY", text: body.trim() };
    if (maxVar > 0) {
      bodyComp.example = { body_text: [Array.from({ length: maxVar }, (_, i) => `Exemplo ${i + 1}`)] };
    }
    components.push(bodyComp);
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
      if (/verification/i.test(msg)) {
        setErr("A Meta exige verificação empresarial para criar templates. Complete a verificação em business.facebook.com.");
      } else {
        setErr(e.detail ? `${msg} — ${e.detail}` : msg);
      }
    } finally { setBusy(false); }
  }

  const renderVars = (txt) =>
    String(txt || "").split(/(\{\{\d+\}\})/g).map((p, i) =>
      /^\{\{\d+\}\}$/.test(p)
        ? <span key={i} className="font-semibold" style={{ color: EMERALD }}>{p}</span>
        : <span key={i}>{p}</span>
    );

  return (
    <DashModal
      open={open}
      onClose={onClose}
      size="lg"
      title="Criar template oficial"
      subtitle="A Meta analisa o template após o envio (geralmente minutos a 24h)."
      footer={
        <>
          <DashButton variant="secondary" onClick={onClose}>Cancelar</DashButton>
          <DashButton onClick={submit} loading={busy} disabled={busy || done}>
            {done ? "Enviado ✓" : busy ? "Enviando para a Meta…" : "Enviar para aprovação Meta"}
          </DashButton>
        </>
      }
    >
      {/* Modelos prontos */}
      <div className="mb-5">
        <div className="text-[11px] text-dash-faint2 uppercase tracking-wider font-semibold mb-2">Modelos prontos</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => loadPreset(p)}
              className="flex items-center gap-2 px-3 py-2 rounded-[12px] border border-dash-border bg-dash-subtle hover:bg-dash-hover transition-colors text-left"
            >
              <span className="text-[12px] font-semibold text-dash-ink">{p.label}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${p.tagColor}1a`, color: p.tagColor }}>{p.tag}</span>
              <span className="text-[10px] text-dash-faint">{p.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <Field label="Nome do template" hint="Só minúsculas, números e _ (ex: boas_vindas)">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="boas_vindas" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
              </Select>
            </Field>
            <Field label="Idioma">
              <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {["pt_BR", "en_US", "es_ES"].map((l) => <option key={l} value={l}>{l}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Cabeçalho (opcional)">
            <div className="space-y-2">
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { k: "NONE", label: "Sem header" },
                  { k: "TEXT", label: "Texto" },
                  { k: "IMAGE", label: "🖼 Imagem" },
                  { k: "VIDEO", label: "🎬 Vídeo" },
                  { k: "DOCUMENT", label: "📄 Documento" },
                ].map(({ k, label }) => (
                  <button key={k} type="button"
                    onClick={() => { setHeaderType(k); setMediaFile(null); setMediaHandle(null); }}
                    className={`px-3 py-1.5 rounded-[10px] text-[12px] font-medium border transition-colors ${
                      headerType === k
                        ? "border-dash-blue bg-dash-blue/8 text-dash-blue"
                        : "border-dash-border text-dash-faint hover:text-dash-ink2"
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
              {headerType === "TEXT" && (
                <>
                  <Input value={header} onChange={(e) => setHeader(e.target.value)} placeholder="Ex: Oferta especial (sem emojis)" />
                  <p className="text-[10px] text-dash-faint mt-1">Sem emojis, asteriscos ou formatação — a Meta não aceita no cabeçalho.</p>
                </>
              )}
              {["IMAGE","VIDEO","DOCUMENT"].includes(headerType) && (
                <div>
                  <input ref={mediaInputRef} type="file" className="hidden"
                    accept={headerType === "IMAGE" ? "image/jpeg,image/png" : headerType === "VIDEO" ? "video/mp4" : "application/pdf"}
                    onChange={handleMediaSelect}
                  />
                  {!mediaFile ? (
                    <button type="button" onClick={() => mediaInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-dash-border rounded-[13px] py-4 text-[13px] text-dash-faint hover:text-dash-ink2 hover:border-dash-blue transition-colors">
                      Clique para selecionar {headerType === "IMAGE" ? "imagem (JPG/PNG)" : headerType === "VIDEO" ? "vídeo (MP4)" : "documento (PDF)"}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-[13px] border border-dash-border bg-dash-subtle">
                      {headerType === "IMAGE" && mediaFile.previewUrl && (
                        <img src={mediaFile.previewUrl} className="size-12 rounded-[9px] object-cover shrink-0" alt="" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-dash-ink truncate">{mediaFile.file.name}</div>
                        {uploading
                          ? <div className="text-[11px] text-dash-faint flex items-center gap-1.5"><Loader2 className="size-3 animate-spin" /> Enviando…</div>
                          : mediaUrl
                            ? <div className="text-[11px]" style={{ color: GREEN }}>✓ Upload concluído</div>
                            : <div className="text-[11px]" style={{ color: RED }}>Falha no upload</div>
                        }
                      </div>
                      <button type="button" onClick={() => { setMediaFile(null); setMediaUrl(null); }}
                        className="size-6 rounded-full flex items-center justify-center hover:bg-dash-hover shrink-0">
                        <X className="size-3.5 text-dash-faint" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Field>
          <Field label="Corpo da mensagem *" hint="Use {{1}}, {{2}} para variáveis">
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4}
              placeholder="Olá {{1}}! Temos uma condição especial pra você: {{2}} de desconto."
              className="dash-input resize-none" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rodapé (opcional)">
              <Input value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="Responda PARAR para sair" />
            </Field>
            <Field label="Botão CTA (opcional)">
              <Input value={btn} onChange={(e) => setBtn(e.target.value)} placeholder="Quero saber mais" />
            </Field>
          </div>
          {err && <div className="text-sm rounded-[13px] px-4 py-3" style={{ color: RED, background: `${RED}0f`, border: `1px solid ${RED}29` }}>{err}</div>}
        </div>

        {/* Pré-visualização */}
        <div className="rounded-[16px] border border-dash-border bg-dash-subtle p-5 flex flex-col">
          <div className="dash-section-label !mb-3">Pré-visualização</div>
          <div className="flex-1 flex items-start">
            <div className="max-w-[92%] rounded-[14px] rounded-tl-sm bg-white border border-dash-border overflow-hidden shadow-[0_1px_3px_rgba(10,16,32,.07)]">
              {headerType === "IMAGE" && mediaFile?.previewUrl && (
                <img src={mediaFile.previewUrl} className="w-full max-h-40 object-cover" alt="" />
              )}
              {headerType === "VIDEO" && mediaFile && (
                <div className="w-full h-20 bg-dash-subtle flex items-center justify-center text-dash-faint text-sm">🎬 {mediaFile.file.name}</div>
              )}
              {headerType === "DOCUMENT" && mediaFile && (
                <div className="w-full h-16 bg-dash-subtle flex items-center justify-center text-dash-faint text-sm">📄 {mediaFile.file.name}</div>
              )}
              <div className="px-3.5 py-2.5">
              {headerType === "TEXT" && header && <div className="text-[13px] font-bold mb-1 text-dash-ink">{renderVars(header)}</div>}
              <div className="text-[13px] leading-snug whitespace-pre-wrap break-words text-dash-ink2">
                {body ? renderVars(body) : <span className="text-dash-placeholder italic">Corpo da mensagem aparece aqui…</span>}
              </div>
              {footer && <div className="text-[11px] text-dash-faint mt-1.5">{footer}</div>}
              <div className="text-[9px] text-dash-faint2 text-right mt-1">agora</div>
              {btn && (
                <div className="mt-2 -mx-3.5 -mb-2.5 border-t border-dash-border2 pt-2 text-center text-[12px] font-semibold" style={{ color: BLUE }}>
                  {btn}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashModal>
  );
}
