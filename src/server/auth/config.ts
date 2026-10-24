import "server-only";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { env } from "@/lib/env";
import { prisma } from "@/server/db";
import { findUserById } from "@/server/repositories/users";
import { findUserByEmail, hasConfirmedSecondFactor } from "@/server/services/auth";
import { verifySignUpToken } from "./signup-token";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    {
      id: "email",
      type: "email",
      name: "Email",
      maxAge: 24 * 60 * 60,
      from: "Coffer <no-reply@coffer.local>",
      async sendVerificationRequest({ url, identifier }: { url: string; identifier: string }) {
        if (env.NODE_ENV === "production") {
          throw new Error("Email delivery is not configured in production");
        }
        console.log(`[coffer] Magic sign-in link for ${identifier}:\n  ${url}\n`);
      },
    },
    Credentials({
      credentials: { token: { label: "Token", type: "text" } },
      async authorize(credentials) {
        const token = typeof credentials?.token === "string" ? credentials.token : "";
        const userId = verifySignUpToken(token);
        if (!userId) return null;
        const user = await findUserById(userId);
        if (!user) return null;
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, email }) {
      // R16: an unknown email clicking a magic link must not silently create a
      // nameless account — send it to sign-up instead.
      if (account?.provider === "email" && !email?.verificationRequest && user.email) {
        const existing = await findUserByEmail(user.email);
        if (!existing) return "/sign-up";
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const id = (user.id ?? token.sub) as string;
        token.twoFactorVerified = !(await hasConfirmedSecondFactor(id));
      }
      if (trigger === "update" && session && typeof session.twoFactorVerified === "boolean") {
        token.twoFactorVerified = session.twoFactorVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as typeof session.user & { id: string }).id = token.sub;
      }
      (session as unknown as { twoFactorVerified: boolean }).twoFactorVerified =
        token.twoFactorVerified !== false;
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/verify-request",
  },
});
