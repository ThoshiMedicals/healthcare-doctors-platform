"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { adminShellKind, adminShellMaxClass } from "./admin-shell";

/**
 * Path-aware clinic admin chrome width (C2).
 * Analytics dashboards → max-w-7xl; CMS content editors → max-w-6xl.
 */
export function AdminShellFrame({
  header,
  nav,
  children,
}: {
  header: ReactNode;
  nav: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname() || "/admin";
  const kind = adminShellKind(pathname);
  const maxClass = adminShellMaxClass(pathname);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" data-admin-shell={kind}>
      <header className="border-b border-slate-200 bg-white">
        <div className={`mx-auto flex items-center justify-between gap-4 px-6 py-4 ${maxClass}`}>
          {header}
        </div>
      </header>
      <div
        className={`mx-auto grid gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 md:grid-cols-[16rem_1fr] ${maxClass}`}
      >
        {nav}
        <div className="min-w-0" data-admin-shell-main={kind}>
          {kind === "analytics" ? (
            <div className="analytics-shell w-full min-w-0" data-analytics-shell="">
              {children}
            </div>
          ) : (
            <div className="cms-shell w-full min-w-0" data-cms-shell="">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
