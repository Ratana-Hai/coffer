import NextAuth from "next-auth";

// Middleware-safe Auth.js config: no Prisma adapter or providers, so it runs on
// the edge runtime. It only decodes the session cookie and exposes the JWT's
// `twoFactorVerified` flag.
export const { auth } = NextAuth({
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as typeof session.user & { id: string }).id = token.sub;
      }
      (session as unknown as { twoFactorVerified: boolean }).twoFactorVerified =
        token.twoFactorVerified !== false;
      return session;
    },
  },
});
