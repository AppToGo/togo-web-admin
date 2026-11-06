"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/** Tamaño maestro de la foto (post de Instagram 4:5). Si la fuente es menor, se amplía: el usuario ve si se pixela y decide. */
export const PRODUCT_IMAGE_ASPECT = 4 / 5;
export const PRODUCT_IMAGE_MAX_WIDTH = 1080;
export const PRODUCT_IMAGE_MAX_HEIGHT = 1350;
const JPEG_QUALITY = 0.85;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Recorta la región elegida y la escala hasta el tamaño maestro sin ampliar. */
async function cropToMaster(source: File, pixels: Area): Promise<File> {
  const objectUrl = URL.createObjectURL(source);
  try {
    const img = await loadImage(objectUrl);
    // El recorte es 4:5 exacto, así que ambas razones coinciden; sin tope
    // de 1: una fuente menor se amplía al tamaño definido.
    const scale = Math.min(
      PRODUCT_IMAGE_MAX_WIDTH / pixels.width,
      PRODUCT_IMAGE_MAX_HEIGHT / pixels.height
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(pixels.width * scale));
    canvas.height = Math.max(1, Math.round(pixels.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas sin contexto 2d");
    ctx.drawImage(
      img,
      pixels.x,
      pixels.y,
      pixels.width,
      pixels.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) throw new Error("No se pudo exportar el recorte");
    const name = source.name.replace(/\.[^.]+$/, "") || "producto";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

interface ProductImageCropperProps {
  /** Archivo a recortar. Con null el diálogo está cerrado. */
  file: File | null;
  onClose: () => void;
  /** Recorte 4:5 exportado como JPEG (máx. 1080×1350). */
  onCropped: (file: File) => void;
}

/**
 * Recorte de la foto del producto estilo Instagram/Facebook: muestra qué
 * parte de la imagen subida se va a ver y entrega el archivo ya cortado al
 * tamaño maestro, para que todas las fotos midan lo mismo.
 */
export function ProductImageCropper({ file, onClose, onCropped }: ProductImageCropperProps) {
  const t = useTranslations("catalog");
  return (
    <Dialog open={file !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t("products.form.cropTitle")}</DialogTitle>
          <DialogDescription>{t("products.form.cropDescription")}</DialogDescription>
        </DialogHeader>
        {file && (
          <CropperBody
            key={`${file.name}-${file.size}-${file.lastModified}`}
            file={file}
            onClose={onClose}
            onCropped={onCropped}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CropperBody({
  file,
  onClose,
  onCropped,
}: {
  file: File;
  onClose: () => void;
  onCropped: (file: File) => void;
}) {
  const t = useTranslations("catalog");
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(false);
  const pixelsRef = useRef<Area | null>(null);
  const [src] = useState(() => URL.createObjectURL(file));

  useEffect(() => () => URL.revokeObjectURL(src), [src]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    pixelsRef.current = pixels;
  }, []);

  const handleApply = async () => {
    if (!pixelsRef.current || applying) return;
    setApplying(true);
    setError(false);
    try {
      onCropped(await cropToMaster(file, pixelsRef.current));
    } catch {
      setError(true);
      setApplying(false);
    }
  };

  return (
    <>
      <div className="relative h-80 w-full overflow-hidden rounded-card-lg bg-slate-900">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={PRODUCT_IMAGE_ASPECT}
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {t("products.form.cropError")}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={applying}>
          {t("products.form.cropCancel")}
        </Button>
        <Button type="button" onClick={handleApply} isLoading={applying}>
          {t("products.form.cropApply")}
        </Button>
      </DialogFooter>
    </>
  );
}
