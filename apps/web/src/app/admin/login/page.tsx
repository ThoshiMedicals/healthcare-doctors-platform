import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { staffDisabled } from "@/auth/session";
import { clientIp, inspectLogin } from "@/auth/login-throttle";
import { loginLockMessage } from "@/auth/login-guard";
import { ACTIVITY_COOKIE, activityCookieOptions } from "@/auth/session-policy";
import "../admin.css";

export const dynamic = "force-dynamic";

async function authenticate(formData: FormData) {
  "use server";

  const username = String(formData.get("username") ?? "");
  const headerStore = await headers();
  const ip = clientIp(headerStore);
  const before = await inspectLogin(username, ip);
  if (!before.allowed) redirect("/admin/login?error=locked");
  if (before.backoffMs > 0) await new Promise((resolve) => setTimeout(resolve, before.backoffMs));

  try {
    const jar = await cookies();
    jar.set(ACTIVITY_COOKIE, String(Date.now()), activityCookieOptions(headerStore.get("x-forwarded-proto") === "https"));
    await signIn("credentials", {
      username,
      password: String(formData.get("password") ?? ""),
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const after = await inspectLogin(username, ip);
      redirect(after.allowed ? "/admin/login?error=1" : "/admin/login?error=locked");
    }
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user?.id) {
    if (await staffDisabled(session.user.id)) redirect("/admin/session-end");
    redirect("/admin");
  }
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <p className="text-sm font-medium text-slate-500">Staff sign in</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Clinic CMS</h1>
      <p className="mt-2 text-sm text-slate-600">
        Username and password. Accounts are created by a Super Admin. There is no public registration.
      </p>
      {params.error === "locked" ? (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {loginLockMessage()}
        </p>
      ) : params.error ? (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Username or password was not accepted.
        </p>
      ) : null}
      <form action={authenticate} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Username
          <input
            className="rounded border border-slate-300 px-3 py-2"
            name="username"
            type="text"
            autoComplete="username"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Password
          <input
            className="rounded border border-slate-300 px-3 py-2"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <button className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white" type="submit">
          Sign in
        </button>
      </form>
      <Link href="/admin/forgot-password" className="mt-4 text-sm text-slate-700 underline">
        Forgot password?
      </Link>
    </main>
  );
}
