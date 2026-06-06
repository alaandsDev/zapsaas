"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Trash2, Mail, Shield, User, Copy, Check } from "lucide-react";
import Topbar from "../../../components/dashboard/Topbar";
import { api, getUser } from "../../../lib/api";

const ROLE_LABEL = { owner: "Dono", admin: "Administrador", agent: "Agente" };
const ROLE_COLOR = { owner: "text-[#00FF88] bg-[#00FF88]/10 border-[#00FF88]/25", admin: "text-blue-300 bg-blue-500/10 border-blue-500/25", agent: "text-gray-300 bg-white/5 border-white/10" };

function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ROLE_COLOR[role] || ROLE_COLOR.agent}`}>
      {ROLE_LABEL[role] || role}
    </span>
  );
}

function Avatar({ name, size = 8 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className={`size-${size} rounded-full bg-gradient-to-br from-[#00FF88]/30 to-[#00D1FF]/30 border border-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0`}>
      {initials}
    </div>
  );
}

export default function ConfiguracoesPage() {
  const currentUser = getUser();
  const isOwner = !currentUser?.workspace_owner_id;

  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("agent");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null); // { type: 'ok'|'err', text }

  const [confirmRemove, setConfirmRemove] = useState(null); // member id

  const load = useCallback(async () => {
    try {
      const [m, i] = await Promise.all([
        api("/api/workspace/members").catch(() => []),
        api("/api/workspace/invites").catch(() => []),
      ]);
      setMembers(Array.isArray(m) ? m : []);
      setInvites(Array.isArray(i) ? i : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function sendInvite(e) {
    e.preventDefault();
    setInviteMsg(null);
    setInviting(true);
    try {
      await api("/api/workspace/invites", { method: "POST", body: { email: inviteEmail, role: inviteRole } });
      setInviteMsg({ type: "ok", text: `Convite criado! Copie o link abaixo e envie para ${inviteEmail} (por WhatsApp, por ex.).` });
      setInviteEmail("");
      load();
    } catch (err) {
      setInviteMsg({ type: "err", text: err.message || "Falha ao enviar convite" });
    } finally {
      setInviting(false);
    }
  }

  async function removeMember(id) {
    try {
      await api(`/api/workspace/members/${id}`, { method: "DELETE" });
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setConfirmRemove(null);
    }
  }

  async function cancelInvite(id) {
    try {
      await api(`/api/workspace/invites/${id}`, { method: "DELETE" });
      setInvites(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  const [copied, setCopied] = useState(null);
  function copyInviteLink(token) {
    const url = `${window.location.origin}/convite/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <>
      <Topbar title="Configurações" subtitle="Equipe e workspace" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Banner para agentes */}
        {!isOwner && (
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] px-5 py-4 flex items-center gap-3">
            <Shield className="size-5 text-blue-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-300">Modo Agente</p>
              <p className="text-xs text-blue-400/80 mt-0.5">
                Você está operando dentro de um workspace. Contate o dono para gerenciar a equipe.
              </p>
            </div>
          </div>
        )}

        {/* Minha conta */}
        <div className="card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <User className="size-4 text-ink-400" /> Minha conta
          </h2>
          <div className="flex items-center gap-4">
            <Avatar name={currentUser?.name} size={12} />
            <div>
              <p className="font-semibold text-sm">{currentUser?.name}</p>
              <p className="text-xs text-ink-400">{currentUser?.email}</p>
              <div className="mt-1.5">
                <RoleBadge role={currentUser?.workspace_owner_id ? (currentUser?.workspace_role || "agent") : "owner"} />
              </div>
            </div>
          </div>
        </div>

        {/* Equipe — só owners */}
        {isOwner && (
          <>
            {/* Convidar */}
            <div className="card p-6">
              <h2 className="font-semibold mb-1 flex items-center gap-2">
                <UserPlus className="size-4 text-ink-400" /> Convidar membro
              </h2>
              <p className="text-xs text-ink-500 mb-5">
                O convidado receberá um e-mail com link para criar a conta e acessar seu workspace.
              </p>
              <form onSubmit={sendInvite} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="email@empresa.com"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-ink-600 focus:outline-none focus:border-primary/40 transition-colors"
                  />
                </div>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/40"
                >
                  <option value="agent">Agente</option>
                  <option value="admin">Administrador</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-bg disabled:opacity-60 shrink-0"
                  style={{ background: "linear-gradient(135deg,#00FF88,#00D1FF)" }}
                >
                  <UserPlus className="size-4" />
                  {inviting ? "Enviando..." : "Convidar"}
                </button>
              </form>

              <AnimatePresence>
                {inviteMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={`mt-3 text-sm px-4 py-3 rounded-xl border ${inviteMsg.type === "ok" ? "bg-primary/10 border-primary/25 text-primary" : "bg-red-500/10 border-red-500/20 text-red-400"}`}
                  >
                    {inviteMsg.text}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Membros ativos */}
            <div className="card p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="size-4 text-ink-400" /> Membros ativos
                <span className="ml-auto text-xs text-ink-500 font-normal">{members.length} membro{members.length !== 1 ? "s" : ""}</span>
              </h2>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-white/[0.04] animate-pulse" />)}
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8 text-ink-500 text-sm">
                  Nenhum membro ainda. Convide alguém acima!
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06]">
                  {members.map(m => (
                    <div key={m.id} className="py-3 flex items-center gap-3">
                      <Avatar name={m.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        <p className="text-xs text-ink-500 truncate">{m.email}</p>
                      </div>
                      <RoleBadge role={m.workspace_role || "agent"} />
                      {confirmRemove === m.id ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-ink-400">Remover?</span>
                          <button onClick={() => removeMember(m.id)} className="text-xs text-red-400 hover:text-red-300 font-semibold">Sim</button>
                          <button onClick={() => setConfirmRemove(null)} className="text-xs text-ink-500 hover:text-ink-300">Não</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmRemove(m.id)} className="size-8 flex items-center justify-center rounded-lg text-ink-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Convites pendentes */}
            {invites.filter(i => i.status === "pending").length > 0 && (
              <div className="card p-6">
                <h2 className="font-semibold mb-4 text-sm flex items-center gap-2">
                  <Mail className="size-4 text-ink-400" /> Convites pendentes
                </h2>
                <div className="divide-y divide-white/[0.06]">
                  {invites.filter(i => i.status === "pending").map(inv => (
                    <div key={inv.id} className="py-3 flex items-center gap-3">
                      <div className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <Mail className="size-4 text-ink-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{inv.email}</p>
                        <p className="text-xs text-ink-500">
                          Expira {new Date(inv.expires_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <RoleBadge role={inv.role} />
                      <button
                        onClick={() => copyInviteLink(inv.token)}
                        title="Copiar link do convite"
                        className="size-8 flex items-center justify-center rounded-lg text-ink-500 hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                      >
                        {copied === inv.token ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                      </button>
                      <button
                        onClick={() => cancelInvite(inv.id)}
                        className="size-8 flex items-center justify-center rounded-lg text-ink-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Links legais */}
        <div className="card p-5 flex items-center gap-4 flex-wrap text-xs text-ink-500">
          <span className="font-medium text-ink-300">Legal</span>
          <a href="/termos" target="_blank" className="hover:text-primary transition-colors">Termos de Uso</a>
          <span>·</span>
          <a href="/privacidade" target="_blank" className="hover:text-primary transition-colors">Política de Privacidade</a>
          <span>·</span>
          <a href="mailto:privacidade@wayvo.com.br" className="hover:text-primary transition-colors">privacidade@wayvo.com.br</a>
        </div>

      </div>
    </>
  );
}
