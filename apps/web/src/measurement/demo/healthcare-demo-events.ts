import { brisbaneDateIso } from "@/measurement/periods";
import type { RawMeasurementEvent } from "@/measurement/types";

/**
 * Healthcare demo event stream for Insights Demo mode (C9).
 * Stored separately from production warehouse (`data/measurement-events.json`).
 * Deterministic — safe for training, presentations, and UAT.
 */

function atBrisbaneDay(isoDay: string, hourUtc: number): string {
  return `${isoDay}T${String(hourUtc).padStart(2, "0")}:15:00.000Z`;
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0)).toISOString().slice(0, 10);
}

const DEMO_PAGES = [
  { path: "index.html", group: "home" as const },
  { path: "services/womens-health.html", group: "service" as const, service: "womens-health" },
  { path: "services/skin-checks.html", group: "service" as const, service: "skin-checks" },
  { path: "services/mental-health.html", group: "service" as const, service: "mental-health" },
  { path: "services/family-health.html", group: "service" as const, service: "family-health" },
  { path: "services/diabetes.html", group: "service" as const, service: "diabetes" },
  {
    path: "doctors/dr-tanya-goodwill.html",
    group: "practitioner" as const,
    practitioner: "dr-tanya-goodwill",
  },
  {
    path: "doctors/dr-sumita-singh.html",
    group: "practitioner" as const,
    practitioner: "dr-sumita-singh",
  },
  {
    path: "doctors/dr-anand-singh.html",
    group: "practitioner" as const,
    practitioner: "dr-anand-singh",
  },
  {
    path: "doctors/dr-wasantha-hettiarchchi.html",
    group: "practitioner" as const,
    practitioner: "dr-wasantha-hettiarchchi",
  },
  { path: "new-patients.html", group: "patient_information" as const },
  { path: "fees-billing.html", group: "patient_information" as const },
  { path: "telehealth.html", group: "patient_information" as const },
  {
    path: "knowledge/articles/when-should-i-book-a-skin-check.html",
    group: "advice_article" as const,
  },
  {
    path: "knowledge/articles/preparing-for-a-diabetes-review.html",
    group: "advice_article" as const,
  },
] as const;

const PLACEMENTS = ["header", "dock", "profile", "digital_reception", "mobile_header", "hero"] as const;

const WATCH_INTENTS = [
  "new_patient",
  "hotdoc_message",
  "vaccination",
  "skin_check",
  "diabetes",
  "telehealth",
  "womens_health",
  "mental_health",
  "fees_billing",
  "appointment_booking",
] as const;

/** ~5 weeks of Woolloongabba-style GP clinic traffic for all Insights dashboards. */
export function buildHealthcareDemoEvents(now = new Date()): RawMeasurementEvent[] {
  const end = brisbaneDateIso(now);
  const events: RawMeasurementEvent[] = [];

  for (let offset = 0; offset < 42; offset++) {
    const day = addDays(end, -offset);
    // Weekdays busier than weekends (Brisbane GP pattern).
    const weekday = new Date(`${day}T12:00:00.000Z`).getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    const daySessions = weekend ? 5 + (offset % 3) : 12 + (offset % 7);

    for (let s = 0; s < daySessions; s++) {
      const session = `demo_${day.replaceAll("-", "")}_${s}`;
      const page = DEMO_PAGES[(offset + s) % DEMO_PAGES.length];
      events.push({
        event: "page_view",
        measurement_version: "2G",
        ts: atBrisbaneDay(day, 1 + (s % 10)),
        session_id: session,
        page_path: page.path,
        page_group: page.group,
        practitioner: "practitioner" in page ? page.practitioner : undefined,
      });

      if (s % 3 === 0) {
        events.push({
          event: "book_appointment_click",
          measurement_version: "2G",
          ts: atBrisbaneDay(day, 2 + (s % 8)),
          session_id: session,
          page_path: page.path,
          page_group: page.group,
          placement: PLACEMENTS[(offset + s) % PLACEMENTS.length],
          destination: page.group === "practitioner" ? "practitioner" : "clinic_list",
          practitioner: "practitioner" in page ? page.practitioner : undefined,
        });
      }

      if (s % 5 === 0) {
        events.push({
          event: "call_clinic_click",
          measurement_version: "2G",
          ts: atBrisbaneDay(day, 3 + (s % 6)),
          session_id: session,
          page_path: page.path,
          page_group: page.group,
          placement: s % 2 === 0 ? "header" : "dock",
          practitioner: "practitioner" in page ? page.practitioner : undefined,
        });
      }

      if (s % 4 === 0) {
        const intent = WATCH_INTENTS[(offset + s) % WATCH_INTENTS.length];
        const zeroResult = intent === "vaccination" && s % 8 === 0;
        const weakResolve = intent === "hotdoc_message" || intent === "new_patient";
        events.push({
          event: "digital_reception_open",
          measurement_version: "2G",
          ts: atBrisbaneDay(day, 4),
          session_id: session,
          page_path: "index.html",
          page_group: "home",
        });
        events.push({
          event: "digital_reception_search",
          measurement_version: "2G",
          ts: atBrisbaneDay(day, 4),
          session_id: session,
          page_path: "index.html",
          page_group: "home",
          intent_bucket: intent,
          result_type: zeroResult ? "no_result" : weakResolve && s % 3 === 0 ? "no_result" : "care_journey",
          result_count: zeroResult || (weakResolve && s % 3 === 0) ? 0 : 2,
        });
        if (!zeroResult && !(weakResolve && s % 3 === 0)) {
          const step =
            s % 5 === 0
              ? "book"
              : s % 7 === 0
                ? "call"
                : s % 3 === 0
                  ? "service"
                  : s % 2 === 0
                    ? "practitioner"
                    : "article";
          const practitionerTarget =
            step === "practitioner"
              ? (["dr-tanya-goodwill", "dr-sumita-singh", "dr-anand-singh"] as const)[(offset + s) % 3]
              : undefined;
          const serviceTarget =
            step === "service"
              ? (["womens-health", "skin-checks", "mental-health", "family-health", "diabetes"] as const)[
                  (offset + s) % 5
                ]
              : undefined;
          events.push({
            event: "digital_reception_result_click",
            measurement_version: "2G",
            ts: atBrisbaneDay(day, 4),
            session_id: session,
            page_path: practitionerTarget
              ? `doctors/${practitionerTarget}.html`
              : serviceTarget
                ? `services/${serviceTarget}.html`
                : "index.html",
            page_group: practitionerTarget ? "practitioner" : serviceTarget ? "service" : "home",
            intent_bucket: intent,
            step,
            practitioner: practitionerTarget,
          });
          if (practitionerTarget && s % 3 === 0) {
            events.push({
              event: "book_appointment_click",
              measurement_version: "2G",
              ts: atBrisbaneDay(day, 4),
              session_id: session,
              page_path: `doctors/${practitionerTarget}.html`,
              page_group: "practitioner",
              placement: "digital_reception",
              destination: "practitioner",
              practitioner: practitionerTarget,
            });
          }
          if (serviceTarget) {
            events.push({
              event: "page_view",
              measurement_version: "2G",
              ts: atBrisbaneDay(day, 4),
              session_id: session,
              page_path: `services/${serviceTarget}.html`,
              page_group: "service",
            });
            if (s % 2 === 0) {
              events.push({
                event: "page_view",
                measurement_version: "2G",
                ts: atBrisbaneDay(day, 4),
                session_id: session,
                page_path: "knowledge/articles/when-should-i-book-a-skin-check.html",
                page_group: "advice_article",
              });
              events.push({
                event: "page_view",
                measurement_version: "2G",
                ts: atBrisbaneDay(day, 4),
                session_id: session,
                page_path: "doctors/dr-tanya-goodwill.html",
                page_group: "practitioner",
                practitioner: "dr-tanya-goodwill",
              });
            }
            if (s % 4 === 0) {
              events.push({
                event: "book_appointment_click",
                measurement_version: "2G",
                ts: atBrisbaneDay(day, 4),
                session_id: session,
                page_path: `services/${serviceTarget}.html`,
                page_group: "service",
                placement: "digital_reception",
                destination: "clinic_list",
              });
            }
          }
        }
      }

      if (s % 6 === 0) {
        events.push({
          event: "task_shortcut_click",
          measurement_version: "2G",
          ts: atBrisbaneDay(day, 5),
          session_id: session,
          page_path: "index.html",
          page_group: "home",
          task: "new_patient",
          surface: "header",
        });
      }
    }
  }

  return events;
}

export const HEALTHCARE_DEMO_DATASET_META = {
  id: "wmc-healthcare-demo-v1",
  label: "Woolloongabba Medical Centre · healthcare demo sample",
  description:
    "Synthetic GP clinic traffic covering Executive, Digital Reception, Authority, Conversion, and related Insights views.",
  storage: "apps/web/src/measurement/demo/healthcare-demo-events.ts",
} as const;
