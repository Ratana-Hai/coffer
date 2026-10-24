import "server-only";
import { prisma } from "@/server/db";

export async function recordLoginAttempt(data: { identifier: string; ip: string }) {
  return prisma.loginAttempt.create({ data });
}

export interface RecentAttempts {
  byIdentifier: number[];
  byIp: number[];
}

export async function recentAttempts(identifier: string, ip: string, since: Date): Promise<RecentAttempts> {
  const [byIdentifier, byIp] = await Promise.all([
    prisma.loginAttempt.findMany({
      where: { identifier, at: { gt: since } },
      select: { at: true },
    }),
    prisma.loginAttempt.findMany({
      where: { ip, at: { gt: since } },
      select: { at: true },
    }),
  ]);
  return {
    byIdentifier: byIdentifier.map((row) => row.at.getTime()),
    byIp: byIp.map((row) => row.at.getTime()),
  };
}
