import { NextResponse } from "next/server";
import { ACTIVITY_COOKIE } from "@/auth/session-policy";

export function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  for (const name of ["authjs.session-token", "__Secure-authjs.session-token", ACTIVITY_COOKIE]) {
    response.cookies.set(name, "", { httpOnly: true, path: "/", maxAge: 0, sameSite: "lax" });
  }
  return response;
}
