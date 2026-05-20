/**
 * uploadToCloudinary — utility lato client per caricare un'immagine.
 *
 * Uso:
 *   const url = await uploadToCloudinary(file);
 *   // url è la secure_url da salvare nel DB
 *
 * Il server genera la firma, il file viene caricato direttamente su Cloudinary.
 */

export async function uploadToCloudinary(file: File): Promise<string> {
  // 1. Chiede la firma al server
  const sigRes = await fetch("/api/upload");
  if (!sigRes.ok) {
    const { error } = await sigRes.json();
    throw new Error(error ?? "Impossibile ottenere la firma di upload");
  }

  const { signature, timestamp, apiKey, cloudName, folder } =
    await sigRes.json();

  // 2. Carica direttamente su Cloudinary
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!uploadRes.ok) {
    throw new Error("Upload su Cloudinary fallito");
  }

  const data = await uploadRes.json();
  return data.secure_url as string;
}

