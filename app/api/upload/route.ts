/**
 * GET /api/upload/signature
 *
 * Genera una firma Cloudinary per l'upload diretto dal browser (signed upload).
 * Il client usa i parametri ricevuti per caricare direttamente su Cloudinary
 * senza passare il file attraverso il server Next.js.
 *
 * Flusso:
 *  1. Client → GET /api/upload/signature        (richiede firma, admin only)
 *  2. Server → { signature, timestamp, apiKey, cloudName, folder }
 *  3. Client → POST https://api.cloudinary.com/v1_1/[cloudName]/image/upload
 *              con il file + i parametri firmati
 *  4. Cloudinary → { secure_url, public_id, ... }
 *  5. Client salva secure_url nella ricetta via PUT /api/recipes/[id]
 *
 * Documentazione Cloudinary:
 *   https://cloudinary.com/documentation/upload_images#signed_upload
 */

import { requireAdmin } from "@/lib/session";
import { ok, err } from "@/lib/api";
import { v2 as cloudinary } from "cloudinary";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER ?? "ricettario";

  if (!cloudName || !apiKey || !apiSecret) {
    return err("Cloudinary non configurato. Imposta CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET nel file .env", 500);
  }

  const timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    apiSecret
  );

  return ok({ signature, timestamp, apiKey, cloudName, folder });
}

