import path from "node:path";

import { PrismaClient } from "../../app/generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const databaseUrl = process.env.DATABASE_URL;
const runtimeDatabaseUrl =
  databaseUrl?.startsWith("file:./")
    ? `file:${path.resolve(process.cwd(), "prisma", databaseUrl.slice("file:./".length))}`
    : databaseUrl;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: runtimeDatabaseUrl
      ? { db: { url: runtimeDatabaseUrl } }
      : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
