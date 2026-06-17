/**
 * Session management — JWT stateless, cookie httpOnly
 * Usato solo server-side (route handlers, server actions)
 */

import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// ---------------------------------------------------------------------------
// Tipi
// ---------------------------------------------------------------------------
export interface SessionPayload {
  adminId: number;
  username: string;
  role: string;
}

// ---------------------------------------------------------------------------
// Costanti
// ---------------------------------------------------------------------------
const COOKIE_NAME = "admin_session";
const EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 giorni in ms

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET non impostato nell'ambiente");
  return new TextEncoder().encode(secret);
}

// ---------------------------------------------------------------------------
// Encrypt / Decrypt
// ---------------------------------------------------------------------------
export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Gestione cookie
// ---------------------------------------------------------------------------
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await encrypt(payload);
  const expiresAt = new Date(Date.now() + EXPIRES_IN);
  const store = await cookies();

  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Legge e verifica la sessione corrente.
 * Ritorna il payload se valido, null altrimenti.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decrypt(token);
}

/**
 * Helper per route handler: blocca la richiesta con 401 se non admin.
 * Ritorna null se autenticato (puoi ignorare il valore),
 * oppure una Response 401 da restituire subito.
 *
 * @example
 * const guard = await requireAdmin();
 * if (guard) return guard;
 */
export async function requireAdmin(): Promise<Response | null> {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
  return null;
}

export async function requireSuperAdmin(): Promise<Response | null> {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non autorizzato" }, { status: 401 });
  }
  if (session.role !== "SUPERADMIN") {
    return Response.json({ error: "Accesso riservato al superadmin" }, { status: 403 });
  }
  return null;
}


