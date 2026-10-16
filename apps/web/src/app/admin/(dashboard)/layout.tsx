import Link from "next/link";
import { signOut } from "@/auth";
import { isSuperAdmin, ROLE_LABEL } from "@/auth/permissions";
import { editorContext } from "@/cms/context";
import { visibleModules } from "@/cms/modules";
import "../admin.css";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await editorContext();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Content editing</p>
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
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-[16rem_1fr]">
        <nav aria-label="CMS modules" className="flex flex-col gap-1 text-sm">
          {visibleModules(role).map((module) => (
            <Link key={module.href} href={module.href} className="rounded px-3 py-2 hover:bg-white">
              {module.label}
            </Link>
          ))}
          {role && isSuperAdmin(role) ? (
            <Link href="/admin/users" className="rounded px-3 py-2 hover:bg-white">
              Staff users
            </Link>
          ) : null}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
