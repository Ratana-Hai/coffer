import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { requireUser } from "@/server/auth/session";
import { findOverview } from "@/server/repositories/overview";

export const getOverview = cache(async () => {
  const user = await requireUser();
  const cookieStore = await cookies();
  const timeZone = cookieStore.get("coffer-timezone")?.value;
  const fallback = Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    if (timeZone) new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return findOverview(user.id, timeZone || fallback);
  } catch {
    return findOverview(user.id, fallback);
  }
});
