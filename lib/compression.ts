// Compression d'image côté navigateur — avant tout envoi.
// Canvas, largeur max 1600 px, JPEG qualité 0,8 : une photo de téléphone
// de 4 Mo descend sous les 400 Ko, indispensable en 3G.

const LARGEUR_MAX = 1600;
const QUALITE_JPEG = 0.8;

export async function compresserImage(fichier: File | Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(fichier);
  try {
    const ratio = Math.min(1, LARGEUR_MAX / bitmap.width);
    const largeur = Math.round(bitmap.width * ratio);
    const hauteur = Math.round(bitmap.height * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = largeur;
    canvas.height = hauteur;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponible");
    ctx.drawImage(bitmap, 0, 0, largeur, hauteur);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITE_JPEG)
    );
    if (!blob) throw new Error("Compression impossible");
    return blob;
  } finally {
    bitmap.close();
  }
}
