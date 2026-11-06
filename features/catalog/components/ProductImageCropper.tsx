"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  PRODUCT_IMAGE_ASPECT,
  cropImageToMaster,
  loadImageElement,
} from "../utils/product-image";

interface ProductImageCropperProps {
  /** Archivo a recortar. Con null el diálogo está cerrado. */
  file: File | null;
  onClose: () => void;
  /** Recorte cuadrado exportado como JPEG (1080×1080, ampliado si hace falta). */
  onCropped: (file: File) => void;
}

/**
 * Recorte de la foto del producto estilo Instagram/Facebook: muestra qué
 * parte de la imagen subida se va a ver y entrega el archivo ya cortado al
 * tamaño maestro cuadrado, para que todas las fotos midan lo mismo.
 */
export function ProductImageCropper({ file, onClose, onCropped }: ProductImageCropperProps) {
  const t = useTranslations("catalog");
  // Mientras se aplica el recorte el diálogo no se puede cerrar (Escape,
  // clic fuera o X): cerrar igual subiría la foto que el usuario canceló.
  const busyRef = useRef(false);
  return (
    <Dialog open={file !== null} onOpenChange={(open) => !open && !busyRef.current && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t("products.form.cropTitle")}</DialogTitle>
          <DialogDescription>{t("products.form.cropDescription")}</DialogDescription>
        </DialogHeader>
        {file && (
          <CropperBody
            key={`${file.name}-${file.size}-${file.lastModified}`}
            file={file}
            busyRef={busyRef}
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
  busyRef,
  onClose,
  onCropped,
}: {
  file: File;
  busyRef: React.MutableRefObject<boolean>;
  onClose: () => void;
  onCropped: (file: File) => void;
}) {
  const t = useTranslations("catalog");
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [applying, setApplying] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const pixelsRef = useRef<Area | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // El object URL se crea una sola vez por archivo; StrictMode puede
  // invocar el factory dos veces en dev (se libera una copia, sin romperse).
  const src = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(src), [src]);

  // La imagen ya cargada se reutiliza al aplicar, sin decodificar dos veces.
  useEffect(() => {
    let cancelled = false;
    loadImageElement(src)
      .then((img) => {
        if (!cancelled) imageRef.current = img;
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      imageRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    busyRef.current = applying;
  }, [applying, busyRef]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    pixelsRef.current = pixels;
    setReady(true);
  }, []);

  const handleApply = async () => {
    if (!pixelsRef.current || !imageRef.current || applying) return;
    setApplying(true);
    setError(false);
    try {
      onCropped(await cropImageToMaster(imageRef.current, file.name, pixelsRef.current));
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
        <Button type="button" onClick={handleApply} disabled={!ready} isLoading={applying}>
          {t("products.form.cropApply")}
        </Button>
      </DialogFooter>
    </>
  );
}
