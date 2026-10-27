"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/config/nav";

type Props = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: Props) {
  const pathname = usePathname();

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
    </nav>
  );
}
