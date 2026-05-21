import { redirect } from "next/navigation";
// Rota legada — fluxos agora são gerenciados no Workflow Builder
export default function Page() {
  redirect("/dashboard/workflow");
}
