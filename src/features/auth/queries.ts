import "server-only";
import { cache } from "react";
import { getSession } from "@/server/auth/session";
import { isNewUser } from "@/server/services/auth";

export type OnboardingState =
  | { authenticated: false; isNew: false }
  | { authenticated: true; isNew: boolean; user: { id: string; name?: string | null; email?: string | null } };

export const getOnboardingState = cache(async (): Promise<OnboardingState> => {
  const session = await getSession();
  if (!session) return { authenticated: false, isNew: false };
  return {
    authenticated: true,
    isNew: await isNewUser(session.user.id),
    user: session.user,
  };
});
