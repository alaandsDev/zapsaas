"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, setAuth } from "../../../lib/api";
import Icon from "../../../components/ui/Icon";

export default function ConvitePage() {
  const { token } = useParams();
  const router = useRouter();

  const [invite, setInvite] = useState(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteErr, setInviteErr] = useState("");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState("");

  useEffect(() => {
    api(`/api/workspace/invites/${token}`, { auth: false })
      .then((d) => { setInvite(d); setLoadingInvite(false); })
      .catch((e) => { setInviteErr(e.message || "Convite inválido"); setLoadingInvite(false); });
  }, [token]);

  async function onSubmit(e) {
    e.preventDefault();
    setFormErr("");
    if (password.length < 6) return setFormErr("Senha precisa ter no mínimo 6 caracteres");
    setSubmitting(true);
    try {
      const r = await api(`/api/workspace/invites/${token}/accept`, {
        method: "POST",
        auth: false,
        body: { name, password },
      });
      setAuth(r.token, r.user);
      router.push("/dashboard");
    } catch (e) {
      setFormErr(e.message || "Falha ao aceitar convite");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold" style={{ background: "linear-gradient(135deg,#00FF88,#00D1FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Wayvo
          </span>
        </div>

        <div className="bg-[#111827] border border-white/[0.07] rounded-2xl p-8">
          {loadingInvite ? (
            <div className="text-center py-8">
              <div className="size-8 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Verificando convite...</p>
            </div>
          ) : inviteErr ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4 text-red-400">
                <Icon name="erro" className="size-10" strokeWidth={1.5} />
              </div>
              <h2 className="text-white font-bold text-lg mb-2">Convite inválido</h2>
              <p className="text-gray-400 text-sm mb-6">{inviteErr}</p>
              <Link href="/login" className="text-[#00FF88] text-sm hover:underline">Ir para o login →</Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3 text-[#00FF88]">
                  <Icon name="sucesso" className="size-10" strokeWidth={1.5} />
                </div>
                <h1 className="text-white font-bold text-xl mb-1">Você foi convidado!</h1>
                <p className="text-gray-400 text-sm">
                  Aceite o convite como{" "}
                  <span className="text-white font-medium">
                    {invite?.role === "admin" ? "Administrador" : "Agente"}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-3 mb-6 text-sm text-gray-400">
                <Icon name="email" className="size-4 shrink-0" />
                <span className="text-white font-medium">{invite?.email}</span>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Seu nome</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como quer ser chamado"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00FF88]/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Criar senha</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00FF88]/40 transition-colors"
                  />
                </div>

                {formErr && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    {formErr}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-[#0B1120] disabled:opacity-60 transition-opacity"
                  style={{ background: "linear-gradient(135deg,#00FF88,#00D1FF)" }}
                >
                  {submitting ? "Entrando..." : "Aceitar convite e entrar →"}
                </button>
              </form>

              <p className="text-xs text-gray-500 text-center mt-4">
                Ao aceitar você concorda com os{" "}
                <Link href="/termos" target="_blank" className="text-[#00FF88] hover:underline">Termos de Uso</Link>.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
