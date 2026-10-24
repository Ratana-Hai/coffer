import "server-only";
import { prisma } from "@/server/db";

export async function findAuthenticatorByUserId(userId: string) {
  return prisma.authenticator.findFirst({ where: { userId } });
}

export async function createAuthenticator(data: { userId: string; secret: string }) {
  return prisma.authenticator.create({ data });
}

export async function deleteUnconfirmedAuthenticator(userId: string) {
  return prisma.authenticator.deleteMany({ where: { userId, confirmedAt: null } });
}

export async function confirmAuthenticator(userId: string) {
  return prisma.authenticator.updateMany({
    where: { userId },
    data: { confirmedAt: new Date() },
  });
}

export async function deleteAuthenticators(userId: string) {
  return prisma.authenticator.deleteMany({ where: { userId } });
}
