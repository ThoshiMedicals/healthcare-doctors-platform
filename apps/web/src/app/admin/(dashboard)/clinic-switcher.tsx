"use client";

import { switchActiveClinic } from "@/cms/actions";

export type ClinicSwitcherOption = {
  slug: string;
  practiceName: string;
};

/**
 * Visible only when the caller already gated on switch_clinic (Network / Super Admin).
 */
export function ClinicSwitcher({
  clinics,
  activeSlug,
}: {
  clinics: ClinicSwitcherOption[];
  activeSlug: string;
}) {
  if (clinics.length === 0) return null;

  return (
    <form action={switchActiveClinic} className="flex items-center gap-2 text-sm">
      <label htmlFor="active-clinic" className="sr-only">
        Active clinic
      </label>
      <select
        id="active-clinic"
        name="clinicSlug"
        defaultValue={activeSlug}
        className="max-w-[16rem] rounded border border-slate-300 bg-white px-2 py-1"
        onChange={(event) => {
          event.currentTarget.form?.requestSubmit();
        }}
      >
        {clinics.map((clinic) => (
          <option key={clinic.slug} value={clinic.slug}>
            {clinic.practiceName}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="rounded border border-slate-300 px-2 py-1">
          Switch
        </button>
      </noscript>
    </form>
  );
}
