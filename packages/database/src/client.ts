import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  lucidPrisma?: PrismaClient;
};

export const db =
  globalForPrisma.lucidPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.lucidPrisma = db;
}

export type { Prisma } from "@prisma/client";
export {
  DreamSource,
  EntityKind,
  InsightLens,
  MembershipRole,
  WorkspaceKind,
} from "@prisma/client";
