/**
 * Script per creare (o aggiornare) l'utente admin nel DB.
 *
 * Utilizzo:
 *   pnpm create-admin
 *
 * Le credenziali si passano come variabili d'ambiente:
 *   ADMIN_USERNAME=iltuonome ADMIN_PASSWORD=latuapassword pnpm create-admin
 *
 * Se non vengono passate, usa i default: admin / admin123
 * (cambiali subito in produzione!)
 */

import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";

  if (password === "admin123") {
    console.warn(
      "\n⚠️  Stai usando la password di default 'admin123'.\n   Cambiala con: ADMIN_PASSWORD=tuapassword pnpm create-admin\n"
    );
  }

  const hashed = await hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: { username },
    update: { password: hashed },
    create: { username, password: hashed },
  });

  console.log(`✅ Admin '${admin.username}' creato/aggiornato (id: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error("❌ Errore:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

