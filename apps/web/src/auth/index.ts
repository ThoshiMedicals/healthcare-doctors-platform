import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/db/prisma";
import { authConfig } from "@/auth/auth.config";
import { clearLoginFailures, clientIp, inspectLogin, recordLoginFailure } from "@/auth/login-throttle";
import { verifyPassword } from "@/auth/password";
import { usernameDisabled } from "@/auth/staff-status";
import { developmentRequestOrigin } from "@/clinics/host";

const credentialsSchema = z.object({
  username: z.string().trim().min(2).max(80),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const username = parsed.data.username.toLowerCase();
        const headerStore = await headers();
        const ip = clientIp(headerStore);
        const gate = await inspectLogin(username, ip);
        if (!gate.allowed) return null;

        const user = await prisma.user.findUnique({
          where: { username },
        });
        if (!user?.passwordHash || !user.username) {
          await recordLoginFailure(username, ip);
          return null;
        }

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) {
          await recordLoginFailure(username, ip);
          return null;
        }
        if (await usernameDisabled(username)) return null;

        await clearLoginFailures(username, ip);
        return {
          id: user.id,
          email: user.email ?? user.username,
          name: user.name ?? user.username,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      const headerStore = await headers();
      const origin =
        developmentRequestOrigin(
          headerStore.get("x-forwarded-host") ?? headerStore.get("host"),
          headerStore.get("x-forwarded-proto"),
        ) ?? baseUrl;
      if (url.startsWith("/")) return `${origin}${url}`;
      try {
        const target = new URL(url);
        if (target.origin === origin || target.origin === baseUrl) {
          return `${origin}${target.pathname}${target.search}${target.hash}`;
        }
      } catch {
        return origin;
      }
      return origin;
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
