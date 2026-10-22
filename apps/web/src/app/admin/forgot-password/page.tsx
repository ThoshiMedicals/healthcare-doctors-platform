import Link from "next/link";
import "../admin.css";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <p className="text-sm font-medium text-slate-500">Staff sign in</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Forgot password</h1>
      <p className="mt-4 text-sm text-slate-700">
        Email recovery is not available. Staff accounts do not use a verified email address, and this CMS does not send mail.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
        <li>If you still know the password, sign in and open Change password.</li>
        <li>If you do not, a Super Admin sets a new password on Staff users. That does not need a database edit.</li>
        <li>A locked sign-in clears when the new password is set, or after the lock expires.</li>
      </ol>
      <p className="mt-4 text-sm text-slate-600">
        If the only Super Admin cannot sign in, that one case still needs someone who can reach the server.
      </p>
      <Link href="/admin/login" className="mt-6 text-sm font-medium text-slate-900 underline">
        Back to sign in
      </Link>
    </main>
  );
}
