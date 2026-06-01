import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/keepalive
 * Esegue una query triviale per mantenere attivo il DB (evita il sleep dopo 7 giorni).
 * Chiamato automaticamente dal cron definito in vercel.json ogni 5 giorni.
 */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, ts: new Date().toISOString() });
  } catch (err) {
    console.error("[keepalive] DB ping failed:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

