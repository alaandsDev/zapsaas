"use client";
import { usePathname } from "next/navigation";

// Telas já convertidas pro tema light ("Wayvo Padrões Internos") — só nelas
// aplicamos o fundo/texto claro do dash-shell. As demais (workflow, conexões
// etc.) continuam no tema escuro padrão, herdando de <body>.
const LIGHT_ROUTES = [
  "/dashboard/conversas",
  "/dashboard/leads",
  "/dashboard/crm",
  "/dashboard/vendas",
  "/dashboard/campanhas",
  "/dashboard/sms",
  "/dashboard/agente-ia",
  "/dashboard/canais",
  "/dashboard/suporte",
  "/dashboard/configuracoes",
];

// A home ("/dashboard") também já foi convertida, mas só deve ativar o tema
// light quando for EXATAMENTE a home — sub-rotas como /dashboard/workflow
// ainda são escuras e não podem ser capturadas por um prefixo aqui.
const LIGHT_EXACT_ROUTES = ["/dashboard"];

export default function DashboardMain({ children }) {
  const pathname = usePathname();
  const isLight =
    LIGHT_EXACT_ROUTES.includes(pathname) ||
    LIGHT_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  return (
    <main className={`flex-1 min-w-0 pb-24 md:pb-0 overflow-x-clip ${isLight ? "dash-shell" : ""}`}>
      {children}
    </main>
  );
}
