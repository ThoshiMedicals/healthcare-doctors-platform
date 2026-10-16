import { ROLE_LABEL } from "@/auth/permissions";
import { editorContext } from "@/cms/context";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const { clinic, role } = await editorContext();

  return (
    <main>
      <h1 className="text-2xl font-semibold">Content editing</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        The public website stays on the approved Woolloongabba HTML. Each field states what it updates
        after approval and publication. Page design and navigation stay as approved.
      </p>
      <dl className="mt-8 grid gap-4 rounded border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Clinic</dt>
          <dd className="font-medium">{clinic?.practiceName ?? "No clinic assigned"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Role</dt>
          <dd className="font-medium">{role ? ROLE_LABEL[role] : "No role on this clinic"}</dd>
        </div>
      </dl>
    </main>
  );
}
