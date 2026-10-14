"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";
import { MobileTopBar } from "./MobileTopBar";
import { cn } from "@/lib/utils";
import { useSingleBranchInit } from "@/features/branches/hooks";
import { UpgradePlanModal, useUpgradePlanModal, TrialBanner } from "@/features/subscription";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // Only drives the mobile drawer (< lg): starts closed and opens with the
  // hamburger button. On desktop the sidebar is always visible.
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  // Seed branch store for users with exactly one branch.
  // BranchMultiSelector is not rendered for them, so without this the store
  // stays empty or holds a stale ID from a previous session.
  useSingleBranchInit();
  const { open, closeModal } = useUpgradePlanModal();

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Sidebar izquierdo (menú) */}
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onMenuClick={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div
        className={cn(
          "min-h-screen flex flex-col",
          "transition-all duration-300",
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        )}
      >
        {/* Móvil y tablet: menú + nombre de la sección */}
        <MobileTopBar
          onMenuClick={() => setSidebarOpen(true)}
          menuOpen={sidebarOpen}
        />

        {/* Trial banner — global, visible on every dashboard page while Free trial is active */}
        <TrialBanner />

        {/* Page content */}
        <main className="flex-1 flex flex-col p-4 sm:p-6">
          <div className="flex-1 flex flex-col max-w-screen-2xl w-full mx-auto">{children}</div>
        </main>
      </div>
      <UpgradePlanModal open={open} onClose={closeModal} />
    </div>
  );
}

