import type { NextAuthConfig } from "next-auth";
import { SESSION_MAX_AGE_SECONDS } from "@/auth/session-policy";

/**
 * Edge-safe Auth.js config. Do not import Prisma here.
 * Route protection for /admin also runs in middleware.ts.
 * The session expires eight hours after sign-in and is not renewed before then.
 */
export const authConfig = {
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [],
} satisfies NextAuthConfig;
