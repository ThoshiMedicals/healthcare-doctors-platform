import Link from "next/link";
import { signOut } from "@/auth";
import { isSuperAdmin, ROLE_LABEL, roleAllows } from "@/auth/permissions";
import { editorContext } from "@/cms/context";
import { visibleNavGroups } from "@/cms/modules";
import { AdminShellFrame } from "./admin-shell-frame";
import "../admin.css";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await editorContext();
  const groups = visibleNavGroups(role);
  const canManageSettings = role ? roleAllows(role, "manage_settings") : false;

  return (
    <AdminShellFrame
      header={
        <>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Clinic admin</p>
            <Link href="/admin" className="text-lg font-semibold">
              Clinic CMS
            </Link>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span>{user.name || user.email}</span>
            {role ? <span className="text-slate-500">{ROLE_LABEL[role]}</span> : null}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/admin/login" });
              }}
            >
              <button className="rounded border border-slate-300 px-3 py-1" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </>
      }
      nav={
        <nav aria-label="Clinic admin" className="flex flex-col gap-6 text-sm md:sticky md:top-4 md:self-start">
          {groups.map((group) => (
            <div key={group.id}>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{group.label}</p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {group.modules.map((module) => (
                  <li key={module.href}>
                    <Link href={module.href} className="block rounded px-3 py-2 hover:bg-white">
                      {module.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {role ? (
            <div>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Account</p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {canManageSettings ? (
                  <li>
                    <Link href="/admin/settings" className="block rounded px-3 py-2 hover:bg-white">
                      Clinic Settings
                    </Link>
                  </li>
                ) : null}
                <li>
                  <Link href="/admin/account" className="block rounded px-3 py-2 hover:bg-white">
                    Change password
                  </Link>
                </li>
                {isSuperAdmin(role) ? (
                  <li>
                    <Link href="/admin/users" className="block rounded px-3 py-2 hover:bg-white">
                      Staff users
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </nav>
      }
    >
      {children}
    </AdminShellFrame>
  );
}
