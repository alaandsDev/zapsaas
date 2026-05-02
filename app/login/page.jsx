"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "../../components/auth/AuthShell";
import { api, setAuth } from "../../lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const r = await api("/api/auth/login", { method: "POST", auth: false, body: { email, password } });
      setAuth(r.token, r.user);
      router.push("/dashboard");
    } catch (e) {
      setErr(e.message || "Falha ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Bem-vindo de volta!"
      subtitle="Digite suas credenciais para acessar sua conta."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/register" className="font-semibold hover:underline" style={{ color: "#00DFA2" }}>
            Crie uma conta grátis
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        {err && <div className="auth-err">{err}</div>}

        <div className="auth-field" style={{ marginBottom: 16 }}>
          <label>E-mail *</label>
          <div className="input-wrap">
            <span className="input-icon">✉️</span>
            <input type="email" required autoComplete="email" placeholder="seu@email.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="auth-field" style={{ marginBottom: 8 }}>
          <label>Senha *</label>
          <div className="input-wrap">
            <span className="input-icon">🔒</span>
            <input type={showPass ? "text" : "password"} required autoComplete="current-password"
              placeholder="Digite sua senha" value={password} onChange={e => setPassword(e.target.value)}
              style={{ paddingRight: 42 }} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 16 }}>
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <div style={{ textAlign: "right", marginBottom: 20 }}>
          <Link href="/forgot-password" style={{ fontSize: 13, color: "#00DFA2", fontWeight: 600, textDecoration: "none" }}>
            Esqueci minha senha
          </Link>
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading && <span style={{ width: 16, height: 16, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} />}
          {loading ? "Entrando..." : "→ Entrar na Plataforma"}
        </button>
      </form>
    </AuthShell>
  );
}
