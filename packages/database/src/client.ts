import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  tardemahPrisma?: PrismaClient;
};

export const db =
  globalForPrisma.tardemahPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.tardemahPrisma = db;
}

export { Prisma } from "@prisma/client";
export {
  DreamSource,
  DreamVisibility,
  EntityKind,
  InsightLens,
  MembershipRole,
  WorkspaceKind,
  WorkspacePlan,
} from "@prisma/client";
