import Link from "next/link";
import {
  ACTION_IMPACT_LABEL,
  ACTION_PRIORITY_LABEL,
  type ActionImpact,
  type ActionPriority,
  type RecommendedAction,
  type RecommendedActionLink,
} from "@/measurement/recommended-actions";
import { DashboardCard, EmptyState, SectionShell, StatusBadge } from "./dashboard-ui";
import type { DashboardTone } from "./dashboard-ui/tokens";

function priorityTone(priority: ActionPriority): DashboardTone {
  if (priority === "p0") return "bad";
  if (priority === "p1") return "warn";
  return "info";
}

function impactTone(impact: ActionImpact): DashboardTone {
  if (impact === "high") return "accent";
  if (impact === "medium") return "info";
  return "neutral";
}

function ActionLinkRow({ link }: { link: RecommendedActionLink }) {
  return (
    <Link
      href={link.href}
      className="inline-flex text-xs font-medium text-slate-800 underline-offset-2 hover:underline"
    >
      {link.label} →
    </Link>
  );
}

export function RecommendedActionsPanel({ actions }: { actions: RecommendedAction[] }) {
  return (
    <SectionShell
      id="cc-guidance"
      title="Recommended actions"
      description="What to fix next — priority, impact, and reason, with deep links into the affected fix list, investigation, and related dashboard."
    >
      {actions.length === 0 ? (
        <EmptyState
          title="No guided actions right now"
          message="Search resolution, contact rates, booking intent, and governance queues look within healthy bands."
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {actions.map((item) => (
            <li key={item.id}>
              <DashboardCard tone={priorityTone(item.priority)}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge
                      label={`Priority · ${ACTION_PRIORITY_LABEL[item.priority]}`}
                      tone={priorityTone(item.priority)}
                    />
                    <StatusBadge
                      label={`Impact · ${ACTION_IMPACT_LABEL[item.impact]}`}
                      tone={impactTone(item.impact)}
                    />
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-800">
                  <span className="font-medium text-slate-900">Action · </span>
                  {item.action}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  <span className="font-medium text-slate-700">Reason · </span>
                  {item.reason}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-200/80 pt-3">
                  <ActionLinkRow link={item.fixList} />
                  <ActionLinkRow link={item.investigation} />
                  <ActionLinkRow link={item.relatedDashboard} />
                </div>
              </DashboardCard>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
}
