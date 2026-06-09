import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Singleton per evitare troppe connessioni in Next.js dev (hot-reload)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL non impostato nell'ambiente. " +
      "Aggiungilo nelle variabili d'ambiente di Vercel (o nel file .env in locale)."
    );
  }
  // max:1 → ogni istanza serverless usa al massimo 1 connessione,
  // evitando di esaurire il connection pool di Supabase (session mode, limit 15).
  const adapter = new PrismaPg({ connectionString: url, max: 1 });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

