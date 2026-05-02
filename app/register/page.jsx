"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../components/auth/AuthShell";
import { api, setAuth } from "../../lib/api";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (password.length < 6) return setErr("Senha precisa ter no mínimo 6 caracteres");
    setLoading(true);
    try {
      const r = await api("/api/auth/register", { method: "POST", auth: false, body: { name, email, password } });
      setAuth(r.token, r.user);
      router.push("/dashboard");
    } catch (e) {
      setErr(e.message || "Falha ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Criar conta grátis"
      subtitle="Plano Starter grátis para sempre. Sem cartão de crédito."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: "#00DFA2" }}>
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        {err && <div className="auth-err">{err}</div>}

        <div className="auth-field" style={{ marginBottom: 16 }}>
          <label>Nome *</label>
          <div className="input-wrap">
            <span className="input-icon">👤</span>
            <input type="text" required placeholder="Seu nome completo"
              value={name} onChange={e => setName(e.target.value)} />
          </div>
        </div>

        <div className="auth-field" style={{ marginBottom: 16 }}>
          <label>E-mail *</label>
          <div className="input-wrap">
            <span className="input-icon">✉️</span>
            <input type="email" required autoComplete="email" placeholder="seu@email.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="auth-field" style={{ marginBottom: 20 }}>
          <label>Senha *</label>
          <div className="input-wrap">
            <span className="input-icon">🔒</span>
            <input type="password" required autoComplete="new-password" placeholder="Mínimo 6 caracteres"
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading && <span style={{ width: 16, height: 16, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} />}
          {loading ? "Criando conta..." : "🚀 Criar conta grátis"}
        </button>

        <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 12 }}>
          Ao continuar você concorda com nossos termos de uso.
        </p>
      </form>
    </AuthShell>
  );
}
