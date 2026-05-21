"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import ComingSoonOverlay from "../../../components/dashboard/ComingSoonOverlay";

export default function SmsPage() {
  const [balance, setBalance] = useState(0);
  const [packages, setPackages] = useState([]);
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
      setPackages(b.packages);
      const h = await api("/api/sms/dispatches");
      setHistory(h);
    } catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

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
    <ComingSoonOverlay title="SMS em breve">
      <div className="page-x">
      <header className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SMS em Massa</h1>
          <p className="text-ink-300 mt-1">Dispare SMS pra sua lista — taxa de abertura altíssima.</p>
        </div>
        <div className="card px-5 py-3 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <svg className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div>
            <div className="text-xs text-ink-400 uppercase tracking-wider">Saldo</div>
            <div className="text-2xl font-bold">{balance} <span className="text-sm text-ink-300 font-normal">SMS</span></div>
          </div>
        </div>
      </header>

      {/* Pacotes */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Comprar créditos</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {packages.map((p) => (
            <div key={p.id} className="card p-6 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{p.credits.toLocaleString("pt-BR")} SMS</div>
                <div className="text-ink-300 text-sm mt-1">R$ {(p.amountCents / 100).toFixed(2).replace(".", ",")} · {(p.amountCents / p.credits / 100).toFixed(3).replace(".", ",")} por SMS</div>
              </div>
              <button onClick={() => buy(p.id)} className="px-5 py-2.5 rounded-xl bg-primary text-bg font-semibold hover:opacity-90">
                Comprar
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Disparo */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Novo disparo</h2>
        <div className="card p-6 space-y-4">
          <div>
            <label className="text-xs text-ink-400 uppercase tracking-wider">Título (opcional)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary"
              placeholder="Ex: Promoção quinta" />
          </div>
          <div>
            <label className="text-xs text-ink-400 uppercase tracking-wider">Contatos (1 por linha — pode ser <code>número|nome</code>)</label>
            <textarea value={phones} onChange={(e) => setPhones(e.target.value)} rows={6}
              className="mt-1 w-full bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary font-mono text-sm"
              placeholder={"11987654321|João\n21999998888|Maria"} />
            <div className="text-xs text-ink-400 mt-1">→ {parsePhones().length} contato(s)</div>
          </div>
          <div>
            <label className="text-xs text-ink-400 uppercase tracking-wider">Mensagem</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
              className="mt-1 w-full bg-bg/60 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-primary"
              placeholder="Olá {nome}, ..." />
            <div className="text-xs text-ink-400 mt-1">
              {charCount} chars · {segments} segmento(s){isUnicode && <span className="text-yellow-400"> (acento/emoji = 70/seg)</span>} · variáveis: <code>{"{nome}"}</code> <code>{"{numero}"}</code>
              {parsePhones().length > 0 && <span className="text-primary"> · custo total: {totalCost} crédito(s)</span>}
            </div>
          </div>
          {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{err}</div>}
          {ok && <div className="text-sm text-primary bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">{ok}</div>}
          <button onClick={dispatch} disabled={loading || !parsePhones().length || !message.trim()}
            className="px-6 py-3 rounded-xl bg-primary text-bg font-semibold hover:opacity-90 disabled:opacity-50">
            {loading ? "Enviando..." : `🚀 Disparar (${totalCost} crédito${totalCost !== 1 ? "s" : ""})`}
          </button>
        </div>
      </section>

      {/* Histórico */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Histórico</h2>
        <div className="card overflow-hidden">
          {!history.length ? (
            <div className="p-8 text-center text-ink-400">Nenhum disparo ainda.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-ink-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Título</th>
                  <th className="text-center px-4 py-3">Total</th>
                  <th className="text-center px-4 py-3">Enviados</th>
                  <th className="text-center px-4 py-3">Falhas</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Quando</th>
                </tr>
              </thead>
              <tbody>
                {history.map((d) => (
                  <tr key={d.id} className="border-t border-white/[0.05]">
                    <td className="px-4 py-3 font-medium">{d.title || "—"}</td>
                    <td className="px-4 py-3 text-center">{d.total}</td>
                    <td className="px-4 py-3 text-center text-primary">{d.sent}</td>
                    <td className="px-4 py-3 text-center text-red-400">{d.failed}</td>
                    <td className="px-4 py-3 text-center">{d.status}</td>
                    <td className="px-4 py-3 text-right text-ink-400 text-xs">{new Date(d.created_at).toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
      </div>
    </ComingSoonOverlay>
  );
}
