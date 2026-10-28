"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { GraduationCap, LogIn, LogOut, Menu, Search, ShieldCheck } from "lucide-react";

type Props = {
  onMenuClick: () => void;
  isMenuOpen: boolean;
};

function initials(name?: string | null, email?: string | null) {
  const label = name?.trim() || email?.trim() || "PolyHub";
  return label
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Navbar({ onMenuClick, isMenuOpen }: Props) {
  const { data: session, status } = useSession();
  const [searchValue, setSearchValue] = useState("");

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button
        aria-label="Open navigation menu"
        aria-controls="mobile-navigation"
        aria-expanded={isMenuOpen}
        className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
        onClick={onMenuClick}
        type="button"
      >
        <Menu aria-hidden="true" className="size-5" />
      </button>
      <Link
        className="flex shrink-0 items-center gap-2.5 font-bold tracking-tight text-slate-950"
        href="/"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-cyan-600 text-white">
          <GraduationCap aria-hidden="true" className="size-5" />
        </span>
        <span className="text-lg">PolyHub</span>
      </Link>

      <label className="relative mx-auto hidden w-full max-w-xl md:block">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
        />
        <input
          aria-label="Search subjects and materials"
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search subjects, materials..."
          type="search"
          value={searchValue}
        />
      </label>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {status === "authenticated" && session?.user?.role === "ADMIN" ? (
          <Link
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-900 transition hover:border-amber-400 hover:bg-amber-100"
            href="/admin/higher-study"
          >
            <ShieldCheck aria-hidden="true" className="size-4 text-amber-700" />
            <span className="hidden sm:inline">Admin Panel</span>
          </Link>
        ) : null}
        {status === "loading" ? (
          <span
            aria-label="Checking session"
            className="size-9 animate-pulse rounded-full bg-slate-100"
          />
        ) : session?.user ? (
          <div className="flex items-center gap-2">
            <Link
              aria-label="View your profile"
              className="flex min-w-0 items-center gap-2 rounded-full transition hover:bg-slate-50"
              href="/dashboard/profile"
              title="View your profile"
            >
              {session.user.image ? (
                <span
                  aria-hidden="true"
                  className="size-9 rounded-full border border-slate-200 bg-cover bg-center"
                  style={{ backgroundImage: `url("${session.user.image}")` }}
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-9 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-800"
                >
                  {initials(session.user.name, session.user.email)}
                </span>
              )}
              <span className="hidden max-w-32 truncate text-sm font-medium text-slate-700 sm:block">
                {session.user.name ?? session.user.email}
              </span>
            </Link>
            <button
              aria-label="Sign out"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sign out"
              type="button"
            >
              <LogOut aria-hidden="true" className="size-4" />
            </button>
          </div>
        ) : (
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
            href="/login"
          >
            <LogIn aria-hidden="true" className="size-4" />
            <span>Login</span>
          </Link>
        )}
      </div>
    </header>
  );
}
