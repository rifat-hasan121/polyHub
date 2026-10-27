import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const cachedPrisma = globalForPrisma.prisma;
const cachedClientHasBtebModels =
  typeof cachedPrisma?.btebNotice?.findMany === "function" &&
  typeof cachedPrisma?.examResult?.findMany === "function";
const cachedClientHasHigherStudyModels =
  typeof cachedPrisma?.higherStudyResource?.findMany === "function" &&
  typeof cachedPrisma?.universityGuide?.findMany === "function";

export const prisma =
  cachedClientHasBtebModels && cachedClientHasHigherStudyModels
    ? cachedPrisma
    : new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
