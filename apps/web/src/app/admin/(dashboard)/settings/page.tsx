import { saveClinicSettings } from "@/cms/actions";
import { requireAction } from "@/cms/context";
import { clinicEditorValues } from "@/cms/restore-sync";
import { ErrorNotice, Field, GateNotice, Impact, SavedNotice, SaveBar, ViewPublicPage } from "../ui";
import { WorkflowControls } from "../workflow-controls";

export const dynamic = "force-dynamic";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; published?: string; error?: string; reason?: string }>;
}) {
  const { clinic, role } = await requireAction("manage_settings");
  const params = await searchParams;
  const profile = clinic.profile;
  const values = profile
    ? clinicEditorValues({
        contentStatus: profile.contentStatus,
        publishedPayload: profile.publishedPayload,
        streetAddress: profile.streetAddress,
        suburb: profile.suburb,
        state: profile.state,
        postcode: profile.postcode,
        phoneDisplay: profile.phoneDisplay,
        email: profile.email,
        hotdocUrl: profile.hotdocUrl ?? "",
        openingHours: clinic.openingHours.map((row) => ({
          dayOfWeek: row.dayOfWeek,
          opens: row.opens,
          closes: row.closes,
        })),
      })
    : null;
  const hours = new Map((values?.openingHours ?? []).map((row) => [row.dayOfWeek, row]));

  return (
    <main>
      <h1 className="text-2xl font-semibold">Clinic settings</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Contact details, the shared HotDoc booking link, and opening hours appear on the public pages after
        approval and publication. The page structure stays as approved.
      </p>
      <ViewPublicPage path="/" />
      <SavedNotice saved={params.saved} published={params.published} status={profile?.contentStatus} />
      <GateNotice error={params.error} reason={params.reason} />
      {!profile ? <ErrorNotice error="missing" /> : null}
      {profile ? (
        <>
        <form action={saveClinicSettings} className="mt-6 grid max-w-2xl gap-4">
          <Field label="Address" name="streetAddress" defaultValue={values?.streetAddress} required impact={["Contact line", "Footer", "Schema"]} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Suburb" name="suburb" defaultValue={values?.suburb} required impact={["Contact line", "Footer", "Schema"]} />
            <Field label="State" name="state" defaultValue={values?.state} required impact={["Contact line", "Footer", "Schema"]} />
            <Field label="Postcode" name="postcode" defaultValue={values?.postcode} required impact={["Contact line", "Footer", "Schema"]} />
          </div>
          <Field label="Phone" name="phoneDisplay" defaultValue={values?.phoneDisplay} required impact={["Header", "Footer", "Contact page", "Schema"]} />
          <Field label="Email" name="email" defaultValue={values?.email} type="email" required impact={["Footer", "Contact page", "Schema"]} />
          <Field label="HotDoc URL" name="hotdocUrl" defaultValue={values?.hotdocUrl} impact={["Header booking", "Homepage booking", "Shared booking buttons"]} />
          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium text-slate-700">Opening hours</legend>
            <Impact items={["Footer", "Contact page", "Schema"]} />
            <div className="grid grid-cols-[8rem_1fr_1fr] gap-2 text-xs font-medium text-slate-500">
              <span />
              <span>Open</span>
              <span>Close</span>
            </div>
            {DAYS.map((day) => (
              <div key={day} className="grid grid-cols-[8rem_1fr_1fr] items-center gap-2 text-sm">
                <span className="capitalize">{day}</span>
                <input className="rounded border border-slate-300 px-2 py-1" name={`opens-${day}`} aria-label={`${day} open`} defaultValue={hours.get(day)?.opens ?? ""} />
                <input className="rounded border border-slate-300 px-2 py-1" name={`closes-${day}`} aria-label={`${day} close`} defaultValue={hours.get(day)?.closes ?? ""} />
              </div>
            ))}
          </fieldset>
          <SaveBar historyHref={`/admin/revisions/clinic_settings/${clinic.id}`} />
        </form>
        <WorkflowControls
          entityType="clinic_settings"
          entityId={clinic.id}
          status={profile.contentStatus}
          returnTo="/admin/settings"
          role={role}
        />
        </>
      ) : null}
    </main>
  );
}
