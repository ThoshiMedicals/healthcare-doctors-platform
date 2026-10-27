import type { AuthorityTierInvestigation } from "@/measurement/authority-tier-investigation";

/** Why-in-tier + recommended next actions for a filtered authority roster row (D2). */
export function AuthorityInvestigationBlock({
  investigation,
}: {
  investigation: AuthorityTierInvestigation;
}) {
  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
      <p>
        <span className="font-medium text-slate-900">Why this tier · </span>
        {investigation.why}
      </p>
      <div>
        <p className="font-medium text-slate-900">Recommendations</p>
        <ul className="mt-1 space-y-1">
          {investigation.recommendations.map((rec) => (
            <li key={rec.id} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
              <span className="shrink-0 font-medium text-slate-800">{rec.label}</span>
              <span className="text-slate-600">{rec.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
