import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { foreignOrigin } from "@/auth/same-origin";
import { ACTIVITY_COOKIE, activityCookieOptions, idleExpired } from "@/auth/session-policy";
import { CLINIC_HOST_HEADER, developmentRequestOrigin, hostnameFromHostHeader, prefersSecureCookie } from "@/clinics/host";
import { publicHostRedirectUrl } from "@/http/public-host";
import { resolveWordpressLegacyRedirect } from "@/seo/wordpress-legacy-redirects";

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

function secureRequest(request: NextRequest): boolean {
  return prefersSecureCookie(request.nextUrl.protocol, request.headers.get("x-forwarded-proto"));
}

async function sessionToken(request: NextRequest) {
  const secure = secureRequest(request);
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
  const hostRedirect = publicHostRedirectUrl({
    hostHeader: host,
    protocol: request.nextUrl.protocol,
    forwardedProto: request.headers.get("x-forwarded-proto"),
    pathname,
    search: request.nextUrl.search,
  });
  if (hostRedirect) {
    return keepOutOfIndex(NextResponse.redirect(hostRedirect, 301), pathname);
  }

  // WordPress pretty URLs → approved .html destinations (single-hop 301, same host).
  const legacyTarget = resolveWordpressLegacyRedirect(pathname);
  if (legacyTarget) {
    // Build an absolute URL so Next does not append a trailing slash to `.html` targets.
    const dest = new URL(legacyTarget, request.nextUrl.origin);
    dest.search = request.nextUrl.search;
    return keepOutOfIndex(NextResponse.redirect(dest, 301), pathname);
  }
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
  const isPublicAdmin = isLogin || pathname === "/admin/forgot-password" || pathname === "/admin/session-end";
  const token = isAdmin ? await sessionToken(request) : null;
  const signedIn = Boolean(token?.sub);
  const origin =
    developmentRequestOrigin(host, request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol) ??
    request.nextUrl.origin;

  if (isAdmin && !isPublicAdmin && !signedIn) {
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
    response.cookies.set(ACTIVITY_COOKIE, String(now), activityCookieOptions(secureRequest(request)));
  }

  return keepOutOfIndex(response, pathname);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
