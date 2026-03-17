import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n/config";

/**
 * Root page
 * 
 * Redirects to the default locale version of the page.
 * The middleware will handle further routing based on auth state.
 */
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
