import { PracticeRecordEditor } from "../../practice-record";

export const dynamic = "force-dynamic";

export default async function PatientRecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; published?: string; error?: string; reason?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  return (
    <PracticeRecordEditor
      id={id}
      saved={query.saved}
      published={query.published}
      error={query.error}
      reason={query.reason}
      returnTo="/admin/patient-information"
    />
  );
}
