import { redirect } from "next/navigation";
// Rota legada — use o Workflow Builder (/dashboard/workflow)
export default function Page() {
  redirect("/dashboard/workflow");
}
