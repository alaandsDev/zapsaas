"use client";
import { useEffect, useState } from "react";
import Topbar from "../../../components/dashboard/Topbar";
import { Field, Input, Button } from "../../../components/ui/Field";
import { api, getUser } from "../../../lib/api";

function fmtDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("pt-BR"); } catch { return "—"; }
}

export default function MinhaContaPage() {
  const [user, setUser] = useState(null);
  const [sub, setSub] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUser(getUser());
    api("/api/subscription").then(setSub).catch(() => {});
    api("/api/usage").then(setUsage).catch(() => {});
  }, []);

  async function checkout() {
    setLoading(true);
    try {
      const r = await api("/api/stripe/checkout", { method: "POST", body: { planId: "pro" } });
      if (r?.url) location.href = r.url;
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  }
  async function portal() {
    setLoading(true);
    try {
      const r = await api("/api/stripe/portal", { method: "POST" });
      if (r?.url) location.href = r.url;
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  }

  const isPro = sub?.plan === "pro" || sub?.status === "active";

  return (
    <>
      <Topbar title="Minha Conta" subtitle="Perfil, plano e configurações" />
      <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
        <div className="card p-6">
          <h3 className="font-semibold mb-4">👤 Perfil</h3>
          <div className="space-y-4">
            <Field label="Nome"><Input value={user?.name || ""} disabled /></Field>
            <Field label="E-mail"><Input value={user?.email || ""} disabled /></Field>
            <p className="text-xs text-ink-500">Para alterar dados de perfil ou senha, entre em contato com o suporte.</p>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4">💳 Plano</h3>
          <div className="flex items-start gap-4 flex-wrap">
            <div className="size-12 rounded-xl bg-gradient-to-br from-primary to-accent-blue text-bg font-bold flex items-center justify-center shrink-0">⚡</div>
            <div className="flex-1 min-w-[200px]">
              <div className="text-sm text-ink-300">Plano atual</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                {isPro ? "Pro" : "Gratuito"}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPro ? "bg-primary/15 text-primary border border-primary/30" : "bg-white/5 text-ink-300 border border-white/10"}`}>
                  {isPro ? "Ativo" : "Free"}
                </span>
              </div>
              <div className="text-sm text-ink-300 mt-1">
                {isPro ? "Disparos ilimitados · Contatos ilimitados · Suporte" : "Até 50 contatos · 3 disparos/mês"}
              </div>
            </div>
            {isPro ? (
              <Button variant="ghost" loading={loading} onClick={portal}>Gerenciar Assinatura</Button>
            ) : (
              <Button loading={loading} onClick={checkout}>Assinar Pro — R$ 47/mês</Button>
            )}
          </div>

          {usage && (
            <div className="mt-5 pt-5 border-t border-white/[0.06] grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-ink-500 text-xs">Disparos usados</div>
                <div className="font-semibold mt-1">{usage.dispatches?.used ?? 0}{usage.dispatches?.limit != null ? ` / ${usage.dispatches.limit}` : ""}</div>
              </div>
              <div>
                <div className="text-ink-500 text-xs">Contatos</div>
                <div className="font-semibold mt-1">{usage.contacts?.used ?? usage.leads?.used ?? 0}{usage.contacts?.limit ?? usage.leads?.limit ? ` / ${usage.contacts?.limit ?? usage.leads?.limit}` : ""}</div>
              </div>
              <div>
                <div className="text-ink-500 text-xs">{isPro ? "Próxima cobrança" : "Renova em"}</div>
                <div className="font-semibold mt-1">{sub?.current_period_end || sub?.expires_at ? fmtDate(sub.current_period_end || sub.expires_at) : "—"}</div>
              </div>
            </div>
          )}
        </div>

        {!isPro && (
          <div className="card p-6 bg-gradient-to-br from-primary/[0.06] to-card border-primary/20">
            <h3 className="font-semibold">Por que assinar o Pro?</h3>
            <ul className="mt-4 space-y-2 text-sm text-ink-100">
              <li className="flex gap-2"><span className="text-primary">✓</span> Disparos ilimitados</li>
              <li className="flex gap-2"><span className="text-primary">✓</span> Contatos e listas ilimitados</li>
              <li className="flex gap-2"><span className="text-primary">✓</span> Agendamento de envios</li>
              <li className="flex gap-2"><span className="text-primary">✓</span> Suporte prioritário no WhatsApp</li>
            </ul>
            <div className="mt-5">
              <Button loading={loading} onClick={checkout}>Assinar Pro — R$ 47/mês</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
