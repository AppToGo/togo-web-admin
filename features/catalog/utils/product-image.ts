/**
 * Reglas de la imagen de producto que se sube con upload-image: las mismas
 * que valida la API (tipo y 5MB), compartidas por el formulario de producto
 * y el drawer de destacar.
 */
export const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const PRODUCT_IMAGE_ACCEPT = "image/png,image/jpeg,image/webp";

export const PRODUCT_IMAGE_MAX_SIZE = 5 * 1024 * 1024;

/** Tamaño maestro de la foto (cuadrado 1080×1080, como la miniatura y el detalle). */
export const PRODUCT_IMAGE_ASPECT = 1;
export const PRODUCT_IMAGE_MAX_WIDTH = 1080;
export const PRODUCT_IMAGE_MAX_HEIGHT = 1080;
const JPEG_QUALITY = 0.85;

export interface CropPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Recorta la región elegida y la escala al tamaño maestro (1080×1080; si la
 * fuente es menor se amplía y el usuario decide si la deja). Exporta JPEG:
 * el PNG/WebP con transparencia se aplana sobre blanco, porque el JPEG no
 * tiene canal alfa (sin esto saldría en negro).
 */
export async function cropImageToMaster(
  img: HTMLImageElement,
  fileName: string,
  pixels: CropPixels,
): Promise<File> {
  // El recorte es cuadrado exacto, así que ambas razones coinciden.
  const scale = Math.min(
    PRODUCT_IMAGE_MAX_WIDTH / pixels.width,
    PRODUCT_IMAGE_MAX_HEIGHT / pixels.height,
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(pixels.width * scale));
  canvas.height = Math.max(1, Math.round(pixels.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas sin contexto 2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    img,
    pixels.x,
    pixels.y,
    pixels.width,
    pixels.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) throw new Error("No se pudo exportar el recorte");
  const name = fileName.replace(/\.[^.]+$/, "") || "producto";
  return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
}

/** Variante que carga el archivo ella misma (cuando no hay imagen ya cargada). */
export async function cropFileToMaster(file: File, pixels: CropPixels): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  try {
    return await cropImageToMaster(await loadImageElement(objectUrl), file.name, pixels);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
