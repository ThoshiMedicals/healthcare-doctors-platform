import type { PracticeExperienceModule } from "@/practice-experience/types";

/**
 * Admin read/preview for one Practice Experience module.
 * Structured fields match the CMS content model so real copy can replace placeholders later.
 */
export function PracticeExperienceModuleEditor({ module }: { module: PracticeExperienceModule }) {
  return (
    <article
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      data-pe-admin-module={module.id}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
            Module {module.order}
          </p>
          <h3 className="text-xl font-semibold text-slate-900">{module.hubTitle}</h3>
          <p className="text-sm text-slate-500">
            id=<code>{module.id}</code> · anchor=<code>#{module.anchor}</code>
          </p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
          {module.media.kind === "ai_placeholder" ? "AI visual placeholder" : module.media.kind}
        </span>
      </header>

      <p className="mt-3 text-sm leading-relaxed text-slate-700">{module.lede}</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr]">
        <figure className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={module.media.src.replace(/^\.\.\//, "/")}
            alt={module.media.alt}
            className="h-36 w-full object-cover"
          />
          <figcaption className="p-2 text-xs text-slate-600">{module.media.caption}</figcaption>
        </figure>

        <div className="space-y-3 text-sm text-slate-700">
          {module.blocks.map((block) => (
            <div key={block.id}>
              <h4 className="font-semibold text-slate-900">
                {block.heading}{" "}
                <span className="font-normal text-slate-500">({block.type})</span>
              </h4>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {block.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <blockquote className="mt-4 border-l-4 border-slate-300 pl-4 text-sm text-slate-800">
        <p>“{module.pullQuote.text}”</p>
        <footer className="mt-1 text-xs text-slate-500">
          {module.pullQuote.attribution} · {module.pullQuote.voice}
        </footer>
      </blockquote>
    </article>
  );
}
