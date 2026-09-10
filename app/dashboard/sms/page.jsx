"use client";
import { useEffect, useState } from "react";
import { MessageSquare, ListChecks, Rocket } from "lucide-react";
import Topbar from "../../../components/dashboard/Topbar";
import { api } from "../../../lib/api";
import {
  DashButton, DashBadge, DashEmptyState,
} from "../../../components/dashboard/DashUI";
import { DASH_ACCENT, dashHeaderIconStyle } from "../../../components/dashboard/dashTheme";

const ACCENT = DASH_ACCENT.blue;

const STATUS = {
  pending:   { label: "Pendente",  color: DASH_ACCENT.amber },
  scheduled: { label: "Agendado",  color: DASH_ACCENT.amber },
  sending:   { label: "Enviando",  color: DASH_ACCENT.blue },
  completed: { label: "Concluído", color: DASH_ACCENT.green },
  failed:    { label: "Falhou",    color: DASH_ACCENT.red },
  paused:    { label: "Pausado",   color: DASH_ACCENT.amber },
  cancelled: { label: "Cancelado", color: DASH_ACCENT.red },
};

function DashField({ label, children, hint }) {
  return (
    <div>
      <label className="text-xs text-dash-faint2 uppercase tracking-wider font-semibold">{label}</label>
      <div className="mt-1.5">{children}</div>
      {hint && <div className="text-xs text-dash-faint mt-1">{hint}</div>}
    </div>
  );
}

export default function SmsPage() {
  const [balance, setBalance] = useState(0);
  const [base, setBase] = useState(0);
  const [paid, setPaid] = useState(0);
  const [packages, setPackages] = useState([]);
  const [lists, setLists] = useState([]);
  const [phones, setPhones] = useState("");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    try {
      const b = await api("/api/sms/balance");
      setBalance(b.credits);
      setBase(b.base ?? 0);
      setPaid(b.paid ?? 0);
      setPackages(b.packages);
      const h = await api("/api/sms/dispatches");
      setHistory(h);
      const ls = await api("/api/lists").catch(() => []);
      setLists(Array.isArray(ls) ? ls : []);
    } catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  // Preenche os contatos a partir de uma lista salva (nome|número)
  function importList(listId) {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    const contacts = Array.isArray(list.contacts) ? list.contacts : [];
    const lines = contacts.map((c) => {
      const phone = String(c.NUMERO || c.phone || c.telefone || c.numero || c.número || "").replace(/\D/g, "");
      const name = c.NOME || c.name || c.nome || c.Nome || "";
      return phone ? `${phone}${name ? "|" + name : ""}` : null;
    }).filter(Boolean);
    setPhones(lines.join("\n"));
  }

  async function buy(packageId) {
    setErr(""); setOk("");
    try {
      const r = await api("/api/sms/purchase", { method: "POST", body: { packageId } });
      window.location.href = r.url;
    } catch (e) { setErr(e.message); }
  }

  function parsePhones() {
    return phones
      .split(/[\n,;]+/)
      .map((line) => {
        const parts = line.trim().split(/[\t|]/);
        if (!parts[0]) return null;
        const phone = parts[0].replace(/\D/g, "");
        const name = parts[1] || "";
        return phone ? { phone, name } : null;
      })
      .filter(Boolean);
  }

  async function dispatch() {
    setErr(""); setOk("");
    const list = parsePhones();
    if (!list.length) return setErr("Adicione pelo menos um número");
    if (!message.trim()) return setErr("Escreva a mensagem");
    const cost = segments * list.length;
    if (cost > balance) return setErr(`Saldo insuficiente: ${balance} créditos, precisa ${cost} (${segments} seg × ${list.length} contatos)`);
    if (!confirm(`Enviar para ${list.length} contato(s)? Custo: ${cost} crédito(s) (${segments} segmento(s) × ${list.length}).`)) return;

    setLoading(true);
    try {
      await api("/api/sms/bulk", {
        method: "POST",
        body: { phones: list, message, title, delaySeconds: 1 }
      });
      setOk(`Disparo iniciado para ${list.length} contatos`);
      setPhones(""); setMessage(""); setTitle("");
      setTimeout(load, 2000);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const charCount = message.length;
  const GSM7_RE = /^[A-Za-z0-9 \r\n@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[\]~|€]*$/;
  const isUnicode = message && !GSM7_RE.test(message);
  const perSeg = isUnicode ? 70 : 160;
  const segments = Math.max(1, Math.ceil(charCount / perSeg));
  const totalCost = segments * parsePhones().length;

  return (
    <>
      <Topbar
        title="SMS"
        subtitle="Dispare SMS em massa pra sua lista"
        actions={
          <div className="flex items-center gap-3 rounded-xl border border-dash-border bg-white px-4 py-2">
            <span style={dashHeaderIconStyle(ACCENT)}>
              <MessageSquare width={16} height={16} />
            </span>
            <div>
              <div className="text-[10px] text-dash-faint uppercase tracking-wider">Saldo total</div>
              <div className="text-sm font-bold text-dash-ink leading-tight">
                {balance} <span className="text-xs text-dash-muted font-normal">SMS</span>
              </div>
              <div className="text-[10px] text-dash-faint mt-0.5">{base} base · {paid} comprados</div>
            </div>
          </div>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16">

        {/* Pacotes */}
        <section>
          <div className="dash-section-label">Comprar créditos</div>
          <div className="grid sm:grid-cols-2 gap-4">
            {packages.map((p) => (
              <div key={p.id} className="dash-card flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-dash-ink">{p.credits.toLocaleString("pt-BR")} SMS</div>
                  <div className="text-dash-faint text-sm mt-1">R$ {(p.amountCents / 100).toFixed(2).replace(".", ",")} · {(p.amountCents / p.credits / 100).toFixed(3).replace(".", ",")} por SMS</div>
                </div>
                <DashButton onClick={() => buy(p.id)}>Comprar</DashButton>
              </div>
            ))}
          </div>
        </section>

        {/* Disparo */}
        <section>
          <div className="dash-section-label">Novo disparo</div>
          <div className="dash-card space-y-4">
            <DashField label="Título (opcional)">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="dash-input" placeholder="Ex: Promoção quinta" />
            </DashField>
            {lists.length > 0 && (
              <DashField label="Importar de uma lista" hint="Puxa nome + número da lista para o campo abaixo.">
                <select onChange={(e) => { if (e.target.value) importList(e.target.value); e.target.value = ""; }}
                  defaultValue="" className="dash-input text-sm">
                  <option value="">Selecione uma lista…</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({(l.contacts?.length ?? l.total ?? 0)} contatos)</option>
                  ))}
                </select>
              </DashField>
            )}
            <DashField label={<>Contatos (1 por linha — pode ser <code>número|nome</code>)</>}>
              <textarea value={phones} onChange={(e) => setPhones(e.target.value)} rows={6}
                className="dash-input font-mono text-sm"
                placeholder={"11987654321|João\n21999998888|Maria"} />
              <div className="text-xs text-dash-faint mt-1">→ {parsePhones().length} contato(s)</div>
            </DashField>
            <DashField label="Mensagem">
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="dash-input" placeholder="Olá {nome}, ..." />
              <div className="text-xs text-dash-faint mt-1">
                {charCount} chars · {segments} segmento(s){isUnicode && <span style={{ color: DASH_ACCENT.amber }}> (acento/emoji = 70/seg)</span>} · variáveis: <code>{"{nome}"}</code> <code>{"{numero}"}</code>
                {parsePhones().length > 0 && <span style={{ color: ACCENT }}> · custo total: {totalCost} crédito(s)</span>}
              </div>
            </DashField>
            {err && <div className="text-sm text-dash-red bg-dash-red/10 border border-dash-red/20 rounded-xl px-4 py-3">{err}</div>}
            {ok && <div className="text-sm rounded-xl px-4 py-3 border" style={{ color: DASH_ACCENT.green, background: `${DASH_ACCENT.green}0f`, borderColor: `${DASH_ACCENT.green}33` }}>{ok}</div>}
            <DashButton onClick={dispatch} disabled={loading || !parsePhones().length || !message.trim()} loading={loading} className="w-full sm:w-auto">
              <Rocket className="size-4" />
              {loading ? "Enviando..." : `Disparar (${totalCost} crédito${totalCost !== 1 ? "s" : ""})`}
            </DashButton>
          </div>
        </section>

        {/* Histórico */}
        <section>
          <div className="dash-section-label">Histórico</div>
          {!history.length ? (
            <DashEmptyState icon={ListChecks} accent={ACCENT} title="Nenhum disparo ainda" desc="Seus disparos de SMS aparecerão aqui." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {history.slice().reverse().map((d) => {
                const total = d.total || 0;
                const sent = d.sent || 0;
                const failed = d.failed || 0;
                const pct = total ? Math.round(((sent + failed) / total) * 100) : 0;
                const st = STATUS[d.status] || { label: d.status || "—", color: DASH_ACCENT.slate };
                return (
                  <div key={d.id} className="dash-card !p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium truncate text-dash-ink">{d.title || "—"}</div>
                      <DashBadge color={st.color} className="shrink-0">{st.label}</DashBadge>
                    </div>
                    <div className="text-[11px] text-dash-faint mt-1">{new Date(d.created_at).toLocaleString("pt-BR")} · {total} contatos</div>
                    <div className="mt-3 h-1.5 rounded-full bg-dash-border2 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ACCENT }} />
                    </div>
                    <div className="flex gap-3 mt-2 text-[11px]">
                      <span style={{ color: DASH_ACCENT.green }}>{sent} enviados</span>
                      <span style={{ color: DASH_ACCENT.red }}>{failed} falhas</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
