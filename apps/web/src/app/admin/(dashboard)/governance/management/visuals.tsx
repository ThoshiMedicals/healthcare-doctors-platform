import Link from "next/link";
import { publicPageName } from "@/cms/staff-labels";
import {
  GOVERNANCE_SEGMENT_LABEL,
  type GovernanceManagementRow,
  type MonthlyWorkloadRow,
  type ReviewCalendarDay,
  type SegmentBreakdown,
} from "@/governance/management-report";
import {
  GOVERNANCE_QUEUE_HINT,
  GOVERNANCE_QUEUE_LABEL,
  GOVERNANCE_QUEUE_NEXT_ACTION,
  toRemediationItems,
  type GovernanceRemediationQueue,
} from "@/governance/remediation";
import {
  DashboardCard,
  EmptyState,
  ProgressBar,
  SectionShell,
  StackedBar,
  StatusBadge,
  formatCount,
  governanceManagementHref,
  type DashboardTone,
  type GovernanceQueue,
} from "../../dashboard-ui";

export { SectionShell, formatCount };

export type WorkloadKind = GovernanceRemediationQueue;

const KIND_TONE: Record<WorkloadKind, DashboardTone> = {
  awaiting_review: "info",
  due_soon: "warn",
  expired: "bad",
  missing_ownership: "accent",
};

const KIND_LABEL = GOVERNANCE_QUEUE_LABEL;

export function StatusChip({ kind, count }: { kind: WorkloadKind; count?: number }) {
  return <StatusBadge label={KIND_LABEL[kind]} tone={KIND_TONE[kind]} count={count} />;
}

export function Legend() {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(KIND_LABEL) as WorkloadKind[]).map((kind) => (
        <StatusChip key={kind} kind={kind} />
      ))}
    </div>
  );
}

export function WorkloadCards({
  totals,
  total,
  activeQueue,
  filters,
}: {
  totals: {
    awaiting_review: number;
    due_within_60_days: number;
    expired: number;
    missing_ownership: number;
  };
  total: number;
  activeQueue?: GovernanceQueue | null;
  /** Carry data mode / other Insights filters into queue drill-through (D1). */
  filters?: import("../../dashboard-ui").InsightsFilters;
}) {
  const cards: Array<{ kind: WorkloadKind; value: number; hint: string; action: string }> = [
    {
      kind: "awaiting_review",
      value: totals.awaiting_review,
      hint: GOVERNANCE_QUEUE_HINT.awaiting_review,
      action: "Open awaiting review queue",
    },
    {
      kind: "due_soon",
      value: totals.due_within_60_days,
      hint: GOVERNANCE_QUEUE_HINT.due_soon,
      action: "Open due soon queue",
    },
    {
      kind: "expired",
      value: totals.expired,
      hint: GOVERNANCE_QUEUE_HINT.expired,
      action: "Open expired queue",
    },
    {
      kind: "missing_ownership",
      value: totals.missing_ownership,
      hint: GOVERNANCE_QUEUE_HINT.missing_ownership,
      action: "Open missing owner queue",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const pct = total ? Math.min(100, (card.value / total) * 100) : 0;
        const active = activeQueue === card.kind;
        return (
          <Link
            key={card.kind}
            href={governanceManagementHref({ queue: card.kind, filters })}
            className="group block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            aria-label={`${KIND_LABEL[card.kind]}: ${card.value}. ${card.action}`}
          >
            <DashboardCard
              tone={KIND_TONE[card.kind]}
              className={`transition group-hover:shadow ${active ? "ring-2 ring-slate-900" : ""}`}
            >
              <StatusChip kind={card.kind} />
              <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-900">{formatCount(card.value)}</p>
              <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
              <p className="mt-2 text-xs text-slate-600">
                <span className="font-medium text-slate-800">Next · </span>
                {GOVERNANCE_QUEUE_NEXT_ACTION[card.kind]}
              </p>
              <div className="mt-3">
                <ProgressBar value={pct} tone={KIND_TONE[card.kind]} />
              </div>
              <p className="mt-1 text-[11px] tabular-nums text-slate-400">
                {pct.toFixed(0)}% of {formatCount(total)} records
              </p>
              <p className="mt-2 text-xs font-medium text-slate-700 underline-offset-2 group-hover:underline">
                Open queue →
              </p>
            </DashboardCard>
          </Link>
        );
      })}
    </div>
  );
}

export function SegmentProgress({
  breakdowns,
  filters,
}: {
  breakdowns: SegmentBreakdown[];
  filters?: import("../../dashboard-ui").InsightsFilters;
}) {
  return (
    <DashboardCard>
      <h3 className="text-sm font-semibold text-slate-900">Workload by collection</h3>
      <p className="mt-0.5 text-xs text-slate-500">
        Progress bars show share of each colour-coded indicator · click a segment to open that queue
      </p>
      {breakdowns.length === 0 ? (
        <EmptyState
          title="No collections"
          message="No governance segments to chart yet."
          className="mt-4"
        />
      ) : (
      <ul className="mt-4 space-y-4">
        {breakdowns.map((row) => {
          const slices: Array<{ kind: WorkloadKind; value: number }> = [
            { kind: "awaiting_review", value: row.awaiting_review },
            { kind: "due_soon", value: row.due_within_60_days },
            { kind: "expired", value: row.expired },
            { kind: "missing_ownership", value: row.missing_ownership },
          ];
          return (
            <li key={row.segment}>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-slate-800">{row.label}</span>
                <span className="tabular-nums text-slate-500">{formatCount(row.total)} pages</span>
              </div>
              <StackedBar
                slices={slices.map((slice) => ({
                  key: `${row.segment}-${slice.kind}`,
                  value: slice.value,
                  tone: KIND_TONE[slice.kind],
                  title: `${KIND_LABEL[slice.kind]}: ${slice.value}`,
                  href:
                    slice.value > 0
                      ? governanceManagementHref({ queue: slice.kind, filters })
                      : undefined,
                }))}
              />
              <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                {slices
                  .filter((slice) => slice.value > 0)
                  .map((slice) => (
                    <Link
                      key={`${row.segment}-legend-${slice.kind}`}
                      href={governanceManagementHref({ queue: slice.kind, filters })}
                      className="tabular-nums underline-offset-2 hover:underline"
                    >
                      {KIND_LABEL[slice.kind]} {formatCount(slice.value)}
                    </Link>
                  ))}
              </div>
            </li>
          );
        })}
      </ul>
      )}
    </DashboardCard>
  );
}

export function ExpiryChart({
  rows,
  filters,
}: {
  rows: MonthlyWorkloadRow[];
  filters?: import("../../dashboard-ui").InsightsFilters;
}) {
  const max = Math.max(...rows.map((row) => row.due_count + row.expired_in_month), 1);
  return (
    <DashboardCard>
      <h3 className="text-sm font-semibold text-slate-900">Expiry chart</h3>
      <p className="mt-0.5 text-xs text-slate-500">
        Review due dates by month · amber due · red expired · click a segment to open the queue
      </p>
      {rows.length === 0 ? (
        <EmptyState title="No review dates" message="No review dates recorded yet." className="mt-4" />
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => {
            const total = row.due_count + row.expired_in_month;
            const width = Math.max((total / max) * 100, total ? 4 : 0);
            return (
              <li key={row.month}>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-slate-800">{row.label}</span>
                  <span className="tabular-nums text-slate-600">
                    {formatCount(row.due_count)} due
                    {row.expired_in_month > 0 ? ` · ${formatCount(row.expired_in_month)} expired` : ""}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100" style={{ width: `${width}%` }}>
                  <StackedBar
                    className="h-3"
                    slices={[
                      {
                        key: "due",
                        value: row.due_count,
                        tone: "warn",
                        title: `Due soon: ${row.due_count}`,
                        href:
                          row.due_count > 0
                            ? governanceManagementHref({ queue: "due_soon", filters })
                            : undefined,
                      },
                      {
                        key: "expired",
                        value: row.expired_in_month,
                        tone: "bad",
                        title: `Expired: ${row.expired_in_month}`,
                        href:
                          row.expired_in_month > 0
                            ? governanceManagementHref({ queue: "expired", filters })
                            : undefined,
                      },
                    ]}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}

export function ReviewCalendar({
  monthLabel,
  days,
  today,
}: {
  monthLabel: string;
  days: ReviewCalendarDay[];
  today: string;
}) {
  if (days.length === 0) {
    return (
      <DashboardCard>
        <h3 className="text-sm font-semibold text-slate-900">Review calendar</h3>
        <EmptyState title="Calendar unavailable" message="No calendar days available." className="mt-4" />
      </DashboardCard>
    );
  }

  const first = days[0].date;
  const [y, m] = first.split("-").map(Number);
  const weekdayOffset = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const blanks = Array.from({ length: weekdayOffset }, (_, index) => index);
  const activeDays = days.filter((day) => day.due_count > 0 || day.expired_count > 0);

  return (
    <DashboardCard>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Review calendar</h3>
          <p className="mt-0.5 text-xs text-slate-500">{monthLabel} · Australia/Brisbane</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip kind="due_soon" />
          <StatusChip kind="expired" />
        </div>
      </div>

      {/* Mobile: compact review list (no cramped month grid) */}
      <div className="mt-4 md:hidden">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Upcoming reviews</p>
        {activeDays.length === 0 ? (
          <EmptyState
            title="Clear month"
            message="No due or expired reviews on the calendar this month."
            className="mt-3"
          />
        ) : (
          <ul className="mt-3 max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {activeDays.map((day) => {
              const isToday = day.date === today;
              return (
                <li key={`mobile-${day.date}`} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">
                      {day.date}
                      {isToday ? <span className="ml-2 text-xs font-normal text-slate-500">Today</span> : null}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {day.due_count > 0 ? <StatusChip kind="due_soon" count={day.due_count} /> : null}
                      {day.expired_count > 0 ? <StatusChip kind="expired" count={day.expired_count} /> : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Desktop: month grid */}
      <div className="mt-4 hidden md:block">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-slate-400">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {blanks.map((blank) => (
            <div key={`blank-${blank}`} className="min-h-14 rounded bg-transparent" />
          ))}
          {days.map((day) => {
            const dayNum = Number(day.date.slice(-2));
            const hasWork = day.due_count > 0 || day.expired_count > 0;
            const isToday = day.date === today;
            return (
              <div
                key={day.date}
                className={`min-h-14 rounded border p-1 text-left ${
                  isToday ? "border-slate-900" : hasWork ? "border-slate-200 bg-slate-50" : "border-transparent"
                }`}
                title={`${day.date}: ${day.due_count} due, ${day.expired_count} expired`}
              >
                <div className="text-[11px] font-medium text-slate-700">{dayNum}</div>
                {hasWork ? (
                  <div className="mt-1 space-y-0.5">
                    {day.due_count > 0 ? (
                      <div className="truncate rounded bg-amber-50 px-1 text-[10px] font-medium text-amber-950">
                        {day.due_count} due
                      </div>
                    ) : null}
                    {day.expired_count > 0 ? (
                      <div className="truncate rounded bg-rose-50 px-1 text-[10px] font-medium text-rose-900">
                        {day.expired_count} exp
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardCard>
  );
}

/** Remediation queue — affected item, next action, owner, due date (D5). */
export function WorkloadList({
  kind,
  hint,
  rows,
  highlighted = false,
  compact = false,
}: {
  kind: WorkloadKind;
  hint?: string;
  rows: GovernanceManagementRow[];
  highlighted?: boolean;
  /** When true, show more rows (focused queue view). */
  compact?: boolean;
}) {
  const items = toRemediationItems(rows, kind);
  const limit = compact ? 60 : 40;
  const visible = items.slice(0, limit);
  const queueHint = hint ?? GOVERNANCE_QUEUE_HINT[kind];

  return (
    <DashboardCard
      tone={KIND_TONE[kind]}
      className={highlighted ? "ring-2 ring-slate-900" : undefined}
    >
      <div id={`queue-${kind}`} className="scroll-mt-6">
        <StatusChip kind={kind} count={rows.length} />
        <p className="mt-1 text-xs text-slate-500">{queueHint}</p>
        <p className="mt-2 text-xs text-slate-700">
          <span className="font-medium text-slate-900">Next action · </span>
          {GOVERNANCE_QUEUE_NEXT_ACTION[kind]}
        </p>
      </div>

      {/* Mobile: stacked remediation cards */}
      <ul className="mt-3 max-h-[28rem] divide-y divide-slate-100 overflow-y-auto md:hidden">
        {visible.length === 0 ? (
          <li className="py-3">
            <EmptyState title="Queue clear" message="No affected items in this queue." />
          </li>
        ) : (
          visible.map((item) => (
            <li key={`${kind}-${item.id}`} className="space-y-2 py-3 text-sm">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Affected item</p>
                <Link href={item.recordHref} className="font-medium text-slate-900 hover:underline">
                  {publicPageName(item.path)}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500">{item.statusLabel}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Next action</p>
                <p className="text-xs text-slate-700">{item.nextAction}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Responsible owner
                  </p>
                  <p className={`text-xs ${item.ownerUnset ? "font-medium text-rose-800" : "text-slate-700"}`}>
                    {item.responsibleOwner}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Review due date
                  </p>
                  <p className="text-xs tabular-nums text-slate-700">{item.reviewDueLabel}</p>
                </div>
              </div>
              <p className="text-xs font-medium text-slate-800">
                <Link href={item.recordHref} className="underline-offset-2 hover:underline">
                  Remediate record →
                </Link>
              </p>
            </li>
          ))
        )}
      </ul>

      {/* Desktop: remediation table */}
      <div className="mt-3 hidden overflow-x-auto md:block">
        {visible.length === 0 ? (
          <EmptyState title="Queue clear" message="No affected items in this queue." className="py-4" />
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-2 pr-3 font-medium">Affected item</th>
                <th className="pb-2 pr-3 font-medium">Next action</th>
                <th className="pb-2 pr-3 font-medium">Responsible owner</th>
                <th className="pb-2 pr-3 font-medium">Review due date</th>
                <th className="pb-2 font-medium"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((item) => (
                <tr key={`${kind}-desk-${item.id}`}>
                  <td className="py-3 pr-3 align-top">
                    <Link href={item.recordHref} className="font-medium text-slate-900 hover:underline">
                      {publicPageName(item.path)}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {GOVERNANCE_SEGMENT_LABEL[item.segment]} · {item.statusLabel}
                    </p>
                  </td>
                  <td className="max-w-[14rem] py-3 pr-3 align-top text-xs text-slate-700">
                    {item.nextAction}
                  </td>
                  <td
                    className={`py-3 pr-3 align-top text-xs ${
                      item.ownerUnset ? "font-medium text-rose-800" : "text-slate-700"
                    }`}
                  >
                    {item.responsibleOwner}
                  </td>
                  <td className="py-3 pr-3 align-top text-xs tabular-nums text-slate-700">
                    {item.reviewDueLabel}
                    {item.urgencyLabel ? (
                      <span className="mt-0.5 block text-[11px] text-slate-500">{item.urgencyLabel}</span>
                    ) : null}
                  </td>
                  <td className="py-3 align-top text-xs font-medium text-slate-800">
                    <Link href={item.recordHref} className="underline-offset-2 hover:underline">
                      Remediate →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rows.length > limit ? (
        <p className="mt-2 text-xs text-slate-500">
          Showing first {limit} of {formatCount(rows.length)} affected items.
        </p>
      ) : null}
    </DashboardCard>
  );
}
