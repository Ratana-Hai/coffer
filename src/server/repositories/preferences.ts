import "server-only";
import { prisma } from "@/server/db";

export interface PreferenceInput {
  currencyCode: string;
  customSymbol: string | null;
  decimals: number;
  position: string;
  themeAccent: string;
  themeBase: string;
  themeMode: string;
}

export async function findPreference(userId: string) {
  return prisma.preference.findUnique({ where: { userId } });
}

export async function upsertPreference(userId: string, data: PreferenceInput) {
  return prisma.preference.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}
