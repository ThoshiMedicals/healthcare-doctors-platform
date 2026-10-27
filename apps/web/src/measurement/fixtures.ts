import { brisbaneDateIso } from "@/measurement/periods";
import type { RawMeasurementEvent } from "@/measurement/types";

function atBrisbaneDay(isoDay: string, hourUtc: number, session: string): string {
  // isoDay is Brisbane calendar date; emit a stable UTC timestamp later that day.
  return `${isoDay}T${String(hourUtc).padStart(2, "0")}:15:00.000Z`;
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0)).toISOString().slice(0, 10);
}

/**
 * Deterministic unit-test fixture stream.
 * Dashboard Demo mode uses `@/measurement/demo/healthcare-demo-events` instead (C9).
 * Not used for public event collection or production warehouse feeds.
 */
export function buildExecutiveFixtureEvents(now = new Date()): RawMeasurementEvent[] {
  const end = brisbaneDateIso(now);
  const events: RawMeasurementEvent[] = [];
  const pages = [
    { path: "index.html", group: "home" },
    { path: "services/womens-health.html", group: "service" },
    { path: "services/skin-checks.html", group: "service" },
    { path: "services/mental-health.html", group: "service" },
    { path: "services/family-health.html", group: "service" },
    { path: "doctors/dr-tanya-goodwill.html", group: "practitioner", practitioner: "dr-tanya-goodwill" },
    { path: "doctors/dr-sumita-singh.html", group: "practitioner", practitioner: "dr-sumita-singh" },
    { path: "doctors/dr-anand-singh.html", group: "practitioner", practitioner: "dr-anand-singh" },
    { path: "doctors/dr-wasantha-hettiarchchi.html", group: "practitioner", practitioner: "dr-wasantha-hettiarchchi" },
    { path: "new-patients.html", group: "patient_information" },
    { path: "fees-billing.html", group: "patient_information" },
    { path: "knowledge/articles/when-should-i-book-a-skin-check.html", group: "advice_article" },
  ] as const;

  const placements = ["header", "dock", "profile", "digital_reception", "mobile_header", "hero"] as const;

  for (let offset = 0; offset < 35; offset++) {
    const day = addDays(end, -offset);
    const daySessions = 8 + (offset % 5);
    for (let s = 0; s < daySessions; s++) {
      const session = `s_${day.replaceAll("-", "")}_${s}`;
      const page = pages[(offset + s) % pages.length];
      events.push({
        event: "page_view",
        measurement_version: "2G",
        ts: atBrisbaneDay(day, 1 + (s % 10), session),
        session_id: session,
        page_path: page.path,
        page_group: page.group,
        practitioner: "practitioner" in page ? page.practitioner : undefined,
      });

      if (s % 3 === 0) {
        events.push({
          event: "book_appointment_click",
          measurement_version: "2G",
          ts: atBrisbaneDay(day, 2 + (s % 8), session),
          session_id: session,
          page_path: page.path,
          page_group: page.group,
          placement: placements[(offset + s) % placements.length],
          destination: page.group === "practitioner" ? "practitioner" : "clinic_list",
          practitioner: "practitioner" in page ? page.practitioner : undefined,
        });
      }

      if (s % 5 === 0) {
        events.push({
          event: "call_clinic_click",
          measurement_version: "2G",
          ts: atBrisbaneDay(day, 3 + (s % 6), session),
          session_id: session,
          page_path: page.path,
          page_group: page.group,
          placement: s % 2 === 0 ? "header" : "dock",
          practitioner: "practitioner" in page ? page.practitioner : undefined,
        });
      }

      if (s % 4 === 0) {
        const watchIntents = ["new_patient", "hotdoc_message", "vaccination", "skin_check", "diabetes"] as const;
        const intent = watchIntents[(offset + s) % watchIntents.length];
        const zeroResult = intent === "vaccination" && s % 8 === 0;
        const weakResolve = intent === "hotdoc_message" || intent === "new_patient";
        events.push({
          event: "digital_reception_open",
          measurement_version: "2G",
          ts: atBrisbaneDay(day, 4, session),
          session_id: session,
          page_path: "index.html",
          page_group: "home",
        });
        events.push({
          event: "digital_reception_search",
          measurement_version: "2G",
          ts: atBrisbaneDay(day, 4, session),
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
              ? (["womens-health", "skin-checks", "mental-health", "family-health"] as const)[(offset + s) % 4]
              : undefined;
          events.push({
            event: "digital_reception_result_click",
            measurement_version: "2G",
            ts: atBrisbaneDay(day, 4, session),
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
              ts: atBrisbaneDay(day, 4, session),
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
              ts: atBrisbaneDay(day, 4, session),
              session_id: session,
              page_path: `services/${serviceTarget}.html`,
              page_group: "service",
            });
            if (s % 2 === 0) {
              events.push({
                event: "page_view",
                measurement_version: "2G",
                ts: atBrisbaneDay(day, 4, session),
                session_id: session,
                page_path: "knowledge/articles/when-should-i-book-a-skin-check.html",
                page_group: "advice_article",
              });
              events.push({
                event: "page_view",
                measurement_version: "2G",
                ts: atBrisbaneDay(day, 4, session),
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
                ts: atBrisbaneDay(day, 4, session),
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
          ts: atBrisbaneDay(day, 5, session),
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
