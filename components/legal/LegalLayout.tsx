import * as React from "react";
import Image from "next/image";
import Link from "next/link";

interface LegalLayoutProps {
  locale: string;
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalLayout({ locale, title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#EEF2FF]">
      <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${locale}/login`} className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Togo"
              width={32}
              height={32}
              className="rounded-full shadow-sm"
            />
            <span className="font-bold text-slate-900">Togo</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{title}</h1>
          <p className="text-sm text-slate-500 mb-8">{lastUpdated}</p>
          <div className="legal-content text-slate-700 leading-relaxed space-y-6">
            {children}
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 mt-8">
          © {new Date().getFullYear()} ToGo — somos@togoapp.co
        </p>
      </main>
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900 mb-2">{heading}</h2>
      <div className="space-y-3 text-[15px]">{children}</div>
    </section>
  );
}
