// src/lib/prisma.ts
// SECURITY FIX: Disable query logging in production
// Logging SQL queries in production can expose sensitive data in server logs

import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // ✅ SECURITY FIX: Only log queries in development
    // In production, only log errors and warnings
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}