"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ClipboardCheck, ShieldCheck } from "lucide-react";
import { navItems } from "@/config/nav";

type Props = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: Props) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAdmin = status === "authenticated" && session?.user?.role === "ADMIN";

  return (
    <nav aria-label="Main navigation">
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Workspace
      </p>
      <ul className="space-y-1">
        {navItems.map(({ title, href, icon: Icon, badge }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={href}>
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-cyan-50 text-cyan-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
                href={href}
                onClick={onNavigate}
              >
                <Icon
                  aria-hidden="true"
                  className={`size-[18px] shrink-0 ${
                    isActive
                      ? "text-cyan-700"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                  strokeWidth={1.8}
                />
                <span className="flex-1">{title}</span>
                {badge ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                    {badge}
                  </span>
                ) : null}
                {isActive ? (
                  <span className="absolute left-0 h-7 w-1 rounded-r-full bg-cyan-600" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      {isAdmin ? (
        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-amber-700">
            Administration
          </p>
          <Link
            aria-current={pathname.startsWith("/admin") ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
              pathname.startsWith("/admin")
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : "border-amber-200 bg-white text-amber-800 hover:bg-amber-50"
            }`}
            href="/admin/higher-study"
            onClick={onNavigate}
          >
            <ShieldCheck aria-hidden="true" className="size-[18px] shrink-0 text-amber-700" />
            <span>Admin Hub</span>
          </Link>
          <Link
            aria-current={pathname.startsWith("/admin/materials") ? "page" : undefined}
            className={`mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              pathname.startsWith("/admin/materials")
                ? "bg-amber-50 text-amber-900"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
            href="/admin/materials"
            onClick={onNavigate}
          >
            <ClipboardCheck aria-hidden="true" className="size-[18px] shrink-0 text-amber-700" />
            <span>Materials Moderation</span>
          </Link>
        </div>
      ) : null}
    </nav>
  );
}
