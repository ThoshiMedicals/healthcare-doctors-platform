import { requireAction } from "@/cms/context";
import { DEMO_DASHBOARD, DEMO_SMS_BASELINE } from "@/engagement-c1/dummy-data";
import { EngagementLabChrome } from "../lab-chrome";

export default async function EngagementLabCostsPage() {
  await requireAction("edit");
  const gross =
    DEMO_SMS_BASELINE.avoidableGeneralSmsCount * DEMO_SMS_BASELINE.costPerSmsAud;

  return (
    <EngagementLabChrome title="Estimated SMS savings">
      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Baseline period</p>
          <p className="mt-2 font-semibold">{DEMO_SMS_BASELINE.periodLabel}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Avoidable general SMS</p>
          <p className="mt-2 text-3xl font-semibold">{DEMO_SMS_BASELINE.avoidableGeneralSmsCount}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Estimate — see methodology</p>
          <p className="mt-2 text-3xl font-semibold">
            ${DEMO_DASHBOARD.estimatedSmsAvoidedAud.toFixed(2)}
          </p>
        </article>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
        <h2 className="font-semibold text-slate-900">Methodology (demonstration)</h2>
        <p className="mt-2">{DEMO_SMS_BASELINE.notes}</p>
        <p className="mt-2">
          Illustrated gross = {DEMO_SMS_BASELINE.avoidableGeneralSmsCount} × $
          {DEMO_SMS_BASELINE.costPerSmsAud.toFixed(2)} = ${gross.toFixed(2)}. Dashboard card uses a
          conservative demonstration net of ${DEMO_DASHBOARD.estimatedSmsAvoidedAud.toFixed(2)}.
        </p>
        <p className="mt-2">
          Clinical appointment reminders and recalls remain with HotDoc and are excluded from savings
          claims.
        </p>
      </section>
    </EngagementLabChrome>
  );
}
