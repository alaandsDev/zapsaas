"use client";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://delivery-full-production.up.railway.app";

const TOKEN_KEY = "wayvo_token";
const USER_KEY  = "wayvo_user";

// Migração silenciosa: se ainda existir chave com brand antiga, move para nova
if (typeof window !== "undefined") {
  const oldToken = localStorage.getItem("zapflow_token");
  const oldUser  = localStorage.getItem("zapflow_user");
  if (oldToken) {
    localStorage.setItem(TOKEN_KEY, oldToken);
    localStorage.removeItem("zapflow_token");
  }
  if (oldUser) {
    localStorage.setItem(USER_KEY, oldUser);
    localStorage.removeItem("zapflow_user");
  }
}

function storage() {
  if (typeof window === "undefined") return null;
  // Se token está no sessionStorage, usa ele (sessão sem "lembrar")
  return sessionStorage.getItem(TOKEN_KEY) ? sessionStorage : localStorage;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
}

export function setAuth(token, user, remember = true) {
  const store = remember ? localStorage : sessionStorage;
  store.setItem(TOKEN_KEY, token);
  if (user) store.setItem(USER_KEY, JSON.stringify(user));
  // Garante que não fique duplicado no outro storage
  if (remember) { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY); }
  else          { localStorage.removeItem(TOKEN_KEY);   localStorage.removeItem(USER_KEY); }
  // Cookie para o middleware Next.js conseguir verificar server-side
  const maxAge = remember ? 60 * 60 * 24 * 30 : undefined; // 30 dias ou sessão
  document.cookie = `wayvo_session=${token}; path=/; SameSite=Strict${maxAge ? `; max-age=${maxAge}` : ""}`;
}

export function getUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return JSON.parse(raw || "null");
  } catch {
    return null;
  }
}

export function clearAuth() {
  [localStorage, sessionStorage].forEach(s => {
    s.removeItem(TOKEN_KEY);
    s.removeItem(USER_KEY);
  });
  document.cookie = "wayvo_session=; path=/; max-age=0";
}

export async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      clearAuth();
      if (!location.pathname.startsWith("/login")) location.href = "/login";
    }
    throw new Error(data?.error || `Erro ${res.status}`);
  }
  return data;
}
