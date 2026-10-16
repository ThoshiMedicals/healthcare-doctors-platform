import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { foreignOrigin } from "@/auth/same-origin";
import { ACTIVITY_COOKIE, activityCookieOptions, idleExpired } from "@/auth/session-policy";
import { CLINIC_HOST_HEADER, developmentRequestOrigin, hostnameFromHostHeader } from "@/clinics/host";

function clearAdminSession(response: NextResponse) {
  for (const name of ["authjs.session-token", "__Secure-authjs.session-token", ACTIVITY_COOKIE]) {
    response.cookies.set(name, "", { httpOnly: true, path: "/", maxAge: 0, sameSite: "lax" });
  }
  return response;
}

/** Staff and API responses must not be indexed. Public pages are left unchanged. */
function keepOutOfIndex(response: NextResponse, pathname: string) {
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

async function sessionToken(request: NextRequest) {
  const secure = request.nextUrl.protocol === "https:";
  return getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: secure,
    salt: secure ? "__Secure-authjs.session-token" : "authjs.session-token",
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (foreignOrigin(request.method, request.headers.get("origin"), host)) {
    return keepOutOfIndex(
      new NextResponse("Forbidden", {
        status: 403,
        headers: { "content-type": "text/plain; charset=utf-8" },
      }),
      pathname,
    );
  }
  const isAdmin = pathname.startsWith("/admin");
  const isLogin = pathname === "/admin/login";
  const token = isAdmin ? await sessionToken(request) : null;
  const signedIn = Boolean(token?.sub);
  const origin =
    developmentRequestOrigin(host, request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol) ??
    request.nextUrl.origin;

  if (isAdmin && !isLogin && !signedIn) {
    return keepOutOfIndex(NextResponse.redirect(new URL("/admin/login", origin)), pathname);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CLINIC_HOST_HEADER, hostnameFromHostHeader(host));
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (isAdmin && !isLogin && signedIn) {
    const rawActivity = request.cookies.get(ACTIVITY_COOKIE)?.value;
    const parsedActivity = rawActivity ? Number(rawActivity) : Number.NaN;
    const lastActivity = Number.isFinite(parsedActivity) ? parsedActivity : null;
    const now = Date.now();
    const issuedAt = typeof token?.iat === "number" ? token.iat * 1000 : 0;
    const freshSignIn = lastActivity == null && issuedAt > 0 && now - issuedAt <= 2 * 60 * 1000;
    if (lastActivity == null ? !freshSignIn : idleExpired(lastActivity, now)) {
      return keepOutOfIndex(clearAdminSession(NextResponse.redirect(new URL("/admin/login", origin))), pathname);
    }
    response.cookies.set(ACTIVITY_COOKIE, String(now), activityCookieOptions(request.nextUrl.protocol === "https:"));
  }

  return keepOutOfIndex(response, pathname);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
