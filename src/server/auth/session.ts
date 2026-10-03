import "server-only";
import { redirect } from "next/navigation";
import { auth } from "./config";

// Dev-only: bypass auth when COFFER_DEV_PREVIEW=1 (development only).
const devPreview = process.env.NODE_ENV === "development" && process.env.COFFER_DEV_PREVIEW === "1";

const devSessionUser = () => ({
  id: "dev-user",
  name: "Dev User",
  email: "dev@coffer.local",
});

export async function requireUser() {
  if (devPreview) return devSessionUser();

  const session = await auth();
  const user = session?.user as
    ({ id?: string; name?: string | null; email?: string | null } & object) | undefined;
  if (!user?.id) redirect("/sign-in?next=%2Foverview");
  return { ...user, id: user.id };
}

export async function getSessionUser() {
  if (devPreview) return devSessionUser();

  const session = await auth();
  return session?.user ?? null;
}
