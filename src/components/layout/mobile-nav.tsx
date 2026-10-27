"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { GraduationCap, X } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function MobileNav({ isOpen, onClose }: Props) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      aria-hidden={!isOpen}
      id="mobile-navigation"
      inert={!isOpen}
      className={`fixed inset-0 z-50 lg:hidden ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <button
        aria-label="Close navigation menu"
        className={`absolute inset-0 h-full w-full bg-slate-950/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        tabIndex={isOpen ? 0 : -1}
        type="button"
      />
      <aside
        aria-label="Mobile navigation"
        aria-modal="true"
        className={`absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col border-r border-slate-200 bg-white p-5 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
      >
        <div className="mb-8 flex items-center justify-between">
          <Link
            className="flex items-center gap-2.5 font-bold tracking-tight text-slate-900"
            href="/"
            onClick={onClose}
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-cyan-600 text-white">
              <GraduationCap aria-hidden="true" className="size-5" />
            </span>
            <span className="text-lg">PolyHub</span>
          </Link>
          <button
            aria-label="Close navigation menu"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100" />}>
          <Sidebar onNavigate={onClose} />
        </Suspense>
      </aside>
    </div>
  );
}
