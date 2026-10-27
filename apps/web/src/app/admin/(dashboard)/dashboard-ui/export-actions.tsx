import Link from "next/link";
import type { ReactNode } from "react";

export function ExportActions({
  csvHref,
  pdfHref,
  monthlyHref,
  extra,
}: {
  csvHref?: string;
  pdfHref?: string;
  monthlyHref?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {csvHref ? (
        <Link
          href={csvHref}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-50"
          prefetch={false}
        >
          Download CSV
        </Link>
      ) : null}
      {pdfHref ? (
        <Link
          href={pdfHref}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-50"
          prefetch={false}
        >
          PDF summary
        </Link>
      ) : null}
      {monthlyHref ? (
        <Link
          href={monthlyHref}
          className="rounded border border-slate-900 bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-800"
          prefetch={false}
        >
          Monthly report
        </Link>
      ) : null}
      {extra}
    </div>
  );
}
