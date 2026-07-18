import { redirect } from "next/navigation";

export default function GeneralSettingsPage() {
  // Redirigir directamente a la configuración del negocio
  redirect("/dashboard/settings/general/business");
}
