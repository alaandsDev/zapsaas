"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Trash2, Mail, Shield, User, Copy, Check } from "lucide-react";
import Topbar from "../../../components/dashboard/Topbar";
import { api, getUser } from "../../../lib/api";
import { DashBadge } from "../../../components/dashboard/DashUI";
import { DASH_ACCENT } from "../../../components/dashboard/dashTheme";

const ROLE_LABEL = { owner: "Dono", admin: "Administrador", agent: "Agente" };
const ROLE_COLOR = { owner: DASH_ACCENT.green, admin: DASH_ACCENT.blue, agent: DASH_ACCENT.slate };

function RoleBadge({ role }) {
  return (
    <DashBadge color={ROLE_COLOR[role] || ROLE_COLOR.agent}>
      {ROLE_LABEL[role] || role}
    </DashBadge>
  );
}

function Avatar({ name, size = 8 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className={`size-${size} rounded-full bg-dash-subtle border border-dash-border flex items-center justify-center text-xs font-bold text-dash-ink2 shrink-0`}>
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
          <div className="rounded-2xl border border-dash-border bg-dash-subtle px-5 py-4 flex items-center gap-3">
            <Shield className="size-5 text-dash-muted shrink-0" />
            <div>
              <p className="text-sm font-semibold text-dash-ink">Modo Agente</p>
              <p className="text-xs text-dash-muted mt-0.5">
                Você está operando dentro de um workspace. Contate o dono para gerenciar a equipe.
              </p>
            </div>
          </div>
        )}

        {/* Minha conta */}
        <div className="dash-card p-6">
          <h2 className="font-semibold text-dash-ink mb-4 flex items-center gap-2">
            <User className="size-4 text-dash-faint" /> Minha conta
          </h2>
          <div className="flex items-center gap-4">
            <Avatar name={currentUser?.name} size={12} />
            <div>
              <p className="font-semibold text-sm text-dash-ink">{currentUser?.name}</p>
              <p className="text-xs text-dash-muted">{currentUser?.email}</p>
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
            <div className="dash-card p-6">
              <h2 className="font-semibold text-dash-ink mb-1 flex items-center gap-2">
                <UserPlus className="size-4 text-dash-faint" /> Convidar membro
              </h2>
              <p className="text-xs text-dash-faint2 mb-5">
                O convidado receberá um e-mail com link para criar a conta e acessar seu workspace.
              </p>
              <form onSubmit={sendInvite} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dash-faint2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="email@empresa.com"
                    className="dash-input w-full pl-10"
                  />
                </div>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="dash-input sm:w-auto"
                >
                  <option value="agent">Agente</option>
                  <option value="admin">Administrador</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting}
                  className="dash-btn-primary shrink-0"
                >
                  <UserPlus className="size-4" />
                  {inviting ? "Enviando..." : "Convidar"}
                </button>
              </form>

              <AnimatePresence>
                {inviteMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={`mt-3 text-sm px-4 py-3 rounded-xl border ${inviteMsg.type === "ok" ? "bg-dash-green/10 border-dash-green/25 text-dash-green" : "bg-dash-red/10 border-dash-red/25 text-dash-red"}`}
                  >
                    {inviteMsg.text}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Membros ativos */}
            <div className="dash-card p-6">
              <h2 className="font-semibold text-dash-ink mb-4 flex items-center gap-2">
                <Users className="size-4 text-dash-faint" /> Membros ativos
                <span className="ml-auto text-xs text-dash-faint2 font-normal">{members.length} membro{members.length !== 1 ? "s" : ""}</span>
              </h2>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="dash-skeleton h-14" />)}
                </div>
              ) : members.length === 0 ? (
                <div className="dash-empty text-sm">
                  Nenhum membro ainda. Convide alguém acima!
                </div>
              ) : (
                <div className="divide-y divide-dash-border2">
                  {members.map(m => (
                    <div key={m.id} className="py-3 flex items-center gap-3">
                      <Avatar name={m.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dash-ink truncate">{m.name}</p>
                        <p className="text-xs text-dash-faint2 truncate">{m.email}</p>
                      </div>
                      <RoleBadge role={m.workspace_role || "agent"} />
                      {confirmRemove === m.id ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-dash-muted">Remover?</span>
                          <button onClick={() => removeMember(m.id)} className="text-xs text-dash-red hover:opacity-80 font-semibold">Sim</button>
                          <button onClick={() => setConfirmRemove(null)} className="text-xs text-dash-faint2 hover:text-dash-muted">Não</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmRemove(m.id)} className="size-8 flex items-center justify-center rounded-lg text-dash-faint2 hover:text-dash-red hover:bg-dash-red/10 transition-colors shrink-0">
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
              <div className="dash-card p-6">
                <h2 className="font-semibold text-dash-ink mb-4 text-sm flex items-center gap-2">
                  <Mail className="size-4 text-dash-faint" /> Convites pendentes
                </h2>
                <div className="divide-y divide-dash-border2">
                  {invites.filter(i => i.status === "pending").map(inv => (
                    <div key={inv.id} className="py-3 flex items-center gap-3">
                      <div className="size-8 rounded-full bg-dash-subtle border border-dash-border flex items-center justify-center shrink-0">
                        <Mail className="size-4 text-dash-faint2" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dash-ink truncate">{inv.email}</p>
                        <p className="text-xs text-dash-faint2">
                          Expira {new Date(inv.expires_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <RoleBadge role={inv.role} />
                      <button
                        onClick={() => copyInviteLink(inv.token)}
                        title="Copiar link do convite"
                        className="size-8 flex items-center justify-center rounded-lg text-dash-faint2 hover:text-dash-green hover:bg-dash-green/10 transition-colors shrink-0"
                      >
                        {copied === inv.token ? <Check className="size-4 text-dash-green" /> : <Copy className="size-4" />}
                      </button>
                      <button
                        onClick={() => cancelInvite(inv.id)}
                        className="size-8 flex items-center justify-center rounded-lg text-dash-faint2 hover:text-dash-red hover:bg-dash-red/10 transition-colors shrink-0"
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
        <div className="dash-card p-5 flex items-center gap-4 flex-wrap text-xs text-dash-faint2">
          <span className="font-medium text-dash-muted">Legal</span>
          <a href="/termos" target="_blank" className="hover:text-dash-ink transition-colors">Termos de Uso</a>
          <span>·</span>
          <a href="/privacidade" target="_blank" className="hover:text-dash-ink transition-colors">Política de Privacidade</a>
          <span>·</span>
          <a href="mailto:privacidade@wayvo.app.br" className="hover:text-dash-ink transition-colors">privacidade@wayvo.app.br</a>
        </div>

      </div>
    </>
  );
}
