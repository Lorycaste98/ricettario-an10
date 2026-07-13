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
  // max:3 → ogni istanza serverless usa al massimo 3 connessioni: abbastanza per far
  // girare in parallelo le query Promise.all di una stessa richiesta (dashboard, dettaglio
  // menù) senza metterle in coda su un'unica connessione, restando comunque ben sotto il
  // limite di 15 del pool Supabase (session mode) col traffico reale di questo sito
  // (un solo admin + picchi di pochi ospiti sul link recensioni).
  const adapter = new PrismaPg({ connectionString: url, max: 3 });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

