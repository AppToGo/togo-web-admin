import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Togo Admin - Order Automation",
  description: "Administrative dashboard for WhatsApp order management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This root layout is a pass-through
  // The actual locale-aware layout is in [locale]/layout.tsx
  return children;
}
