import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "./config";

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface AuthSession {
  user: SessionUser;
  twoFactorVerified: boolean;
}

export const getSession = cache(async (): Promise<AuthSession | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    },
    twoFactorVerified:
      (session as unknown as { twoFactorVerified?: boolean }).twoFactorVerified !== false,
  };
});

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session.user;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}
