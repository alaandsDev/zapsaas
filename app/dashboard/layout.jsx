import Sidebar from "../../components/dashboard/Sidebar";
import AuthGuard from "../../components/dashboard/AuthGuard";
import AiCopilot from "../../components/dashboard/AiCopilot";
import NotificationProvider from "../../components/dashboard/NotificationProvider";
import DashboardMain from "../../components/dashboard/DashboardMain";

export const metadata = { title: "Wayvo — Painel" };

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <DashboardMain>{children}</DashboardMain>
        <AiCopilot />
        <NotificationProvider />
      </div>
    </AuthGuard>
  );
}
