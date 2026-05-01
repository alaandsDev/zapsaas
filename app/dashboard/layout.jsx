import Sidebar from "../../components/dashboard/Sidebar";
import AuthGuard from "../../components/dashboard/AuthGuard";

export const metadata = { title: "ZapFlow — Painel" };

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </AuthGuard>
  );
}
