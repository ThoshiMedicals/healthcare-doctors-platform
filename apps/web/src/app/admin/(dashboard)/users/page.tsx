import { CREATABLE_STAFF_ROLES, ROLE_LABEL } from "@/auth/permissions";
import { createStaffUser, grantSuperAdmin, resetStaffPassword, setStaffEnabled, setStaffRole } from "@/cms/actions";
import { requireAction } from "@/cms/context";
import { disabledFlags } from "@/auth/staff-status";
import { prisma } from "@/db/prisma";
import { staffCreateMessage, type StaffCreateIssue } from "@/cms/staff-create";
import { ErrorNotice, Field, Impact, SavedNotice } from "../ui";

const CREATE_ISSUES = new Set<StaffCreateIssue>(["name", "username", "short", "confirm", "role", "duplicate"]);

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { clinic, user } = await requireAction("create_users");
  const params = await searchParams;
  const users = await prisma.clinicMembership.findMany({
    where: { clinicId: clinic.id },
    include: { user: { select: { id: true, username: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  const disabled = await disabledFlags(users.map((membership) => membership.user.id));
  const createIssue = CREATE_ISSUES.has(params.error as StaffCreateIssue) ? (params.error as StaffCreateIssue) : null;

  return (
    <main>
      <h1 className="text-2xl font-semibold">Staff users</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Only a Super Admin can create users, grant Super Admin, set another person’s password, disable an account, or move a person between Content Editor and Clinic Admin. Grant Super Admin is a separate action from Promote to Clinic Admin and Demote to Content Editor. Disabled accounts stay in the record. They are not deleted, and their audit and governance history stays with them.
        There is no public registration and no social login. Email recovery is not available.
      </p>
      {params.saved === "reset" ? (
        <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Password updated. The person can sign in with the new password. Any sign-in lock on that username is cleared.
        </p>
      ) : params.saved === "disabled" ? (
        <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Account disabled. That person can no longer sign in. The account and its history remain.
        </p>
      ) : params.saved === "enabled" ? (
        <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Account enabled. That person can sign in again.
        </p>
      ) : params.saved === "granted" ? (
        <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Super Admin granted. The new permissions apply on the next request. The previous role, the new role, and this sign-in are recorded.
        </p>
      ) : params.saved === "role" ? (
        <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Role updated. The new permissions apply on the next request. The account and its history remain.
        </p>
      ) : params.saved === "created" ? (
        <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          User created. They can sign in with that username and password.
        </p>
      ) : (
        <SavedNotice saved={params.saved} />
      )}
      {createIssue ? (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {staffCreateMessage(createIssue)}
        </p>
      ) : params.error === "password" ? (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          That password was not set. Use at least 8 characters and enter it twice. Change your own password from Change password.
        </p>
      ) : params.error === "lifecycle" ? (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          That account was not changed. You cannot disable your own sign-in or the last Super Admin.
        </p>
      ) : params.error === "role" ? (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          That role was not changed. You cannot change your own role, remove the last Super Admin, or assign Reviewer, Approver, or Publisher.
        </p>
      ) : (
        <ErrorNotice error={params.error === "1" ? undefined : params.error} />
      )}
      {params.error === "1" ? (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          That user was not created. Check the name, username, and password.
        </p>
      ) : null}
      <form action={createStaffUser} className="mt-6 grid max-w-xl gap-4 rounded border border-slate-200 bg-white p-4">
        <Field label="Name" name="name" required impact={[]} />
        <Field label="Username" name="username" required minLength={2} autoComplete="username" impact={[]} />
        <p className="text-sm text-slate-600">At least 2 characters. The username is stored in lowercase.</p>
        <Field label="Password" name="password" type="password" required minLength={8} autoComplete="new-password" impact={[]} />
        <Field label="Confirm password" name="confirm" type="password" required minLength={8} autoComplete="new-password" impact={[]} />
        <p className="text-sm text-slate-600">At least 8 characters. Enter the same password in both fields.</p>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Role
          <Impact items={[]} />
          <select className="rounded border border-slate-300 px-3 py-2" name="role" defaultValue="content_editor">
            {CREATABLE_STAFF_ROLES.map((role) => (
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
          <li key={membership.id} className="px-4 py-3 text-sm">
            <div className="flex justify-between gap-4">
              <span>{membership.user.username ?? membership.user.name}</span>
              <span className="text-slate-500">
                {ROLE_LABEL[membership.role]}
                {" · "}
                {disabled.get(membership.user.id) ? "Disabled" : "Active"}
              </span>
            </div>
            {membership.user.id === user.id ? (
              <p className="mt-2 text-slate-500">Change your own password from Change password. This sign-in cannot be disabled or given another role here.</p>
            ) : (
              <div className="mt-3 grid max-w-md gap-3">
                <form action={resetStaffPassword} className="grid gap-2">
                  <input type="hidden" name="userId" value={membership.user.id} />
                  <Field label="New password" name="password" type="password" required impact={[]} />
                  <Field label="Confirm new password" name="confirm" type="password" required impact={[]} />
                  <button className="w-fit rounded border border-slate-300 px-3 py-2 text-sm" type="submit">
                    Set new password
                  </button>
                </form>
                <form action={setStaffEnabled}>
                  <input type="hidden" name="userId" value={membership.user.id} />
                  <input type="hidden" name="enabled" value={disabled.get(membership.user.id) ? "1" : "0"} />
                  <button className="w-fit rounded border border-slate-300 px-3 py-2 text-sm" type="submit">
                    {disabled.get(membership.user.id) ? "Enable account" : "Disable account"}
                  </button>
                </form>
                {membership.role === "content_editor" || membership.role === "clinic_admin" ? (
                  <>
                    <form action={setStaffRole}>
                      <input type="hidden" name="userId" value={membership.user.id} />
                      <input type="hidden" name="role" value={membership.role === "content_editor" ? "clinic_admin" : "content_editor"} />
                      <button className="w-fit rounded border border-slate-300 px-3 py-2 text-sm" type="submit">
                        {membership.role === "content_editor" ? "Promote to Clinic Admin" : "Demote to Content Editor"}
                      </button>
                    </form>
                    <form action={grantSuperAdmin}>
                      <input type="hidden" name="userId" value={membership.user.id} />
                      <button className="w-fit rounded border border-slate-300 px-3 py-2 text-sm" type="submit">
                        Grant Super Admin
                      </button>
                    </form>
                  </>
                ) : null}
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
