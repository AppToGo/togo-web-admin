"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

/**
 * Settings Page - Redirects to General Settings
 *
 * This page acts as a navigation hub that redirects to the first
 * settings submenu item (General). The settings navigation is now
 * organized as an expandable submenu in the sidebar.
 */
export default function SettingsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    // Redirect to the Business settings page
    router.replace(`/${locale}/dashboard/settings/general/business`);
  }, [router, locale]);

  // Return null while redirecting
  return null;
}
