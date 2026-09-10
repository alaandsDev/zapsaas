"use client";
import { usePathname } from "next/navigation";

// Telas já convertidas pro tema light ("Wayvo Padrões Internos") — só nelas
// aplicamos o fundo/texto claro do dash-shell. As demais (home, workflow,
// conexões etc.) continuam no tema escuro padrão, herdando de <body>.
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

export default function DashboardMain({ children }) {
  const pathname = usePathname();
  const isLight = LIGHT_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  return (
    <main className={`flex-1 min-w-0 pb-24 md:pb-0 overflow-x-clip ${isLight ? "dash-shell" : ""}`}>
      {children}
    </main>
  );
}
