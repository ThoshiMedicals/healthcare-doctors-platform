import type { MeasurementEvent, RawMeasurementEvent } from "@/measurement/types";

export type ClinicMeasurementRef = {
  clinicId?: string | null;
  clinicSlug?: string | null;
};

/**
 * Filter warehouse / demo events to one clinic.
 * Events without clinic identifiers are treated as belonging to the default (legacy) clinic
 * so existing Woolloongabba warehouse rows remain visible.
 */
export function filterEventsForClinic<T extends MeasurementEvent | RawMeasurementEvent>(
  events: readonly T[],
  clinic: ClinicMeasurementRef,
  options?: { defaultSlug?: string; includeUnscopedAsDefault?: boolean },
): T[] {
  const slug = (clinic.clinicSlug || "").trim();
  const id = (clinic.clinicId || "").trim();
  if (!slug && !id) return [...events];

  const defaultSlug = options?.defaultSlug || process.env.DEFAULT_CLINIC_SLUG || "woolloongabba";
  const includeUnscoped = options?.includeUnscopedAsDefault ?? true;
  const treatingAsDefault = Boolean(slug && slug === defaultSlug) || !slug;

  return events.filter((event) => {
    const eventSlug =
      "clinic_slug" in event && event.clinic_slug ? String(event.clinic_slug) : "";
    const eventId = "clinic_id" in event && event.clinic_id ? String(event.clinic_id) : "";

    if (id && eventId && eventId === id) return true;
    if (slug && eventSlug && eventSlug === slug) return true;

    if (!eventSlug && !eventId) {
      return includeUnscoped && treatingAsDefault;
    }
    return false;
  });
}
