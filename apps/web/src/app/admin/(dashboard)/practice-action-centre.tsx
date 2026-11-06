import Link from "next/link";
import type { PracticeActionItem, PracticeKpiCard } from "@/cms/practice-operations-dashboard";

const TONE_CLASS: Record<PracticeActionItem["tone"], string> = {
  critical: "border-rose-300 bg-rose-50 hover:border-rose-400",
  attention: "border-amber-300 bg-amber-50 hover:border-amber-400",
  watch: "border-slate-200 bg-white hover:border-slate-400",
  ok: "border-slate-200 bg-white hover:border-slate-300",
};

const TONE_VALUE: Record<PracticeActionItem["tone"], string> = {
  critical: "text-rose-900",
  attention: "text-amber-900",
  watch: "text-slate-900",
  ok: "text-slate-500",
};

export function PracticeActionCentre({
  items,
  needsAttentionTotal,
}: {
  items: PracticeActionItem[];
  needsAttentionTotal: number;
}) {
  return (
    <section className="mt-6" aria-labelledby="needs-attention-today-heading">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Action centre</p>
          <h2 id="needs-attention-today-heading" className="text-lg font-semibold text-slate-900">
            Needs attention today
          </h2>
          <p className="text-sm text-slate-600">
            What needs attention right now — queues first, then open the module to act.
          </p>
        </div>
        <p className="rounded border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">{needsAttentionTotal}</span> open attention items
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`rounded border px-4 py-3 ${TONE_CLASS[item.tone]}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{item.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${TONE_VALUE[item.tone]}`}>{item.value}</p>
            <p className="mt-1 text-xs text-slate-600">{item.hint}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function PracticeKpiStrip({
  id,
  title,
  description,
  href,
  hrefLabel,
  cards,
}: {
  id: string;
  title: string;
  description: string;
  href: string;
  hrefLabel: string;
  cards: PracticeKpiCard[];
}) {
  return (
    <section className="mt-6" aria-labelledby={id}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id={id} className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <Link href={href} className="text-sm font-medium text-slate-800 underline underline-offset-2">
          {hrefLabel}
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded border border-slate-200 bg-white px-4 py-3 hover:border-slate-400"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
