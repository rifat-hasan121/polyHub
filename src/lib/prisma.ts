import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const cachedPrisma = globalForPrisma.prisma;
const cachedClientHasBtebModels =
  typeof cachedPrisma?.btebNotice?.findMany === "function" &&
  typeof cachedPrisma?.examResult?.findMany === "function";

export const prisma =
  cachedClientHasBtebModels ? cachedPrisma : new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
