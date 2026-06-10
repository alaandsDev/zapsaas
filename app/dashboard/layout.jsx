import Sidebar from "../../components/dashboard/Sidebar";
import AuthGuard from "../../components/dashboard/AuthGuard";
import AiCopilot from "../../components/dashboard/AiCopilot";
import NotificationProvider from "../../components/dashboard/NotificationProvider";

export const metadata = { title: "Wayvo — Painel" };

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-24 md:pb-0 overflow-x-clip">{children}</main>
        <AiCopilot />
        <NotificationProvider />
      </div>
    </AuthGuard>
  );
}
