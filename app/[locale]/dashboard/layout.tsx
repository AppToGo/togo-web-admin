import { DashboardRealtime } from "@/components/layout/DashboardRealtime";

/**
 * Layout del dashboard: persiste entre navegaciones, así que los sockets de
 * pedidos y conversaciones no se cierran al cambiar de pantalla. Cada página
 * sigue montando su propio `DashboardLayout` (sidebar + header).
 */
export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DashboardRealtime />
      {children}
    </>
  );
}
