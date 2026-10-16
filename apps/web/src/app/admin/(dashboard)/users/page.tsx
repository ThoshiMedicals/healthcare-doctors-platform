import { ASSIGNABLE_ROLES, ROLE_LABEL } from "@/auth/permissions";
import { createStaffUser } from "@/cms/actions";
import { requireAction } from "@/cms/context";
import { prisma } from "@/db/prisma";
import { ErrorNotice, Field, Impact, SavedNotice } from "../ui";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { clinic } = await requireAction("create_users");
  const params = await searchParams;
  const users = await prisma.clinicMembership.findMany({
    where: { clinicId: clinic.id },
    include: { user: { select: { username: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main>
      <h1 className="text-2xl font-semibold">Staff users</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Only a Super Admin can create users. There is no public registration and no social login.
      </p>
      <SavedNotice saved={params.saved} />
      <ErrorNotice error={params.error} />
      <form action={createStaffUser} className="mt-6 grid max-w-xl gap-4 rounded border border-slate-200 bg-white p-4">
        <Field label="Name" name="name" required impact={[]} />
        <Field label="Username" name="username" required impact={[]} />
        <Field label="Password" name="password" type="password" required impact={[]} />
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Role
          <Impact items={[]} />
          <select className="rounded border border-slate-300 px-3 py-2" name="role" defaultValue="content_editor">
            {ASSIGNABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABEL[role]}
              </option>
            ))}
          </select>
        </label>
        <button className="w-fit rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white" type="submit">
          Create user
        </button>
      </form>
      <ul className="mt-6 divide-y divide-slate-200 rounded border border-slate-200 bg-white">
        {users.map((membership) => (
          <li key={membership.id} className="flex justify-between px-4 py-3 text-sm">
            <span>{membership.user.username ?? membership.user.name}</span>
            <span className="text-slate-500">{ROLE_LABEL[membership.role]}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
