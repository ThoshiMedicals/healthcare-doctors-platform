import { changeOwnPassword } from "@/cms/actions";
import { editorContext } from "@/cms/context";
import { redirect } from "next/navigation";
import { Field } from "../ui";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { role } = await editorContext();
  if (!role) redirect("/admin/login");
  const params = await searchParams;

  return (
    <main>
      <h1 className="text-2xl font-semibold">Change password</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Use your current password. A Super Admin sets a new password for someone who cannot sign in.
        The CMS does not email a reset link.
      </p>
      {params.saved === "1" ? (
        <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Password updated. Use it the next time you sign in.
        </p>
      ) : null}
      {params.error === "password" ? (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          That password was not changed. Enter the current password, then a new password of at least 8 characters, twice.
        </p>
      ) : null}
      <form action={changeOwnPassword} className="mt-6 grid max-w-xl gap-4 rounded border border-slate-200 bg-white p-4">
        <Field label="Current password" name="current" type="password" required impact={[]} />
        <Field label="New password" name="password" type="password" required impact={[]} />
        <Field label="Confirm new password" name="confirm" type="password" required impact={[]} />
        <p className="text-sm text-slate-600">At least 8 characters. It must be different from the current password.</p>
        <button className="w-fit rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white" type="submit">
          Update password
        </button>
      </form>
    </main>
  );
}
