"use client";

import { useState } from "react";
import { Suspense, type ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";

type Props = {
  children: ReactNode;
};

export function AppShell({ children }: Props) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  function closeMobileNav() {
    setIsMobileNavOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar
        isMenuOpen={isMobileNavOpen}
        onMenuClick={() => setIsMobileNavOpen(true)}
      />
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={closeMobileNav}
      />
      <aside className="fixed bottom-0 left-0 top-16 z-20 hidden w-64 border-r border-slate-200 bg-white px-4 py-6 lg:block">
        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100" />}>
          <Sidebar />
        </Suspense>
      </aside>
      <main className="min-h-[calc(100vh-4rem)] lg:pl-64">
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
