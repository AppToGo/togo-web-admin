import { redirect } from "next/navigation";

/**
 * Locale root page
 * 
 * Redirects to the dashboard for authenticated users.
 * The middleware handles unauthenticated users.
 */
export default function LocalePage() {
  redirect("/dashboard");
}
