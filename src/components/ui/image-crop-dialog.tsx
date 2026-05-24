import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Source = File | Blob | string | null;

export type ImageCropDialogProps = {
  open: boolean;
  source: Source;
  onOpenChange: (open: boolean) => void;
  /** Called with the cropped blob, or null if user skipped. */
  onResult: (blob: Blob | null) => void;
  title?: string;
};

async function sourceToObjectUrl(src: Source): Promise<string | null> {
  if (!src) return null;
  if (typeof src === "string") {
    // Fetch URL to bypass canvas tainting (Supabase public buckets allow CORS).
    try {
      const res = await fetch(src, { mode: "cors" });
      if (!res.ok) throw new Error(`Failed to load image (${res.status})`);
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } catch (e) {
      // Fallback: pass the URL through; canvas may taint and export will fail
      // but selection still works for cancel.
      console.warn("Crop: CORS fetch failed, falling back to direct URL", e);
      return src;
    }
  }
  return URL.createObjectURL(src);
}

async function cropToBlob(image: HTMLImageElement, crop: PixelCrop, mime: string): Promise<Blob> {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(crop.width * scaleX));
  canvas.height = Math.max(1, Math.round(crop.height * scaleY));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Crop failed"))), mime, 0.92);
  });
}

export function ImageCropDialog({ open, source, onOpenChange, onResult, title = "Crop image" }: ImageCropDialogProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [busy, setBusy] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const createdUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCrop(undefined);
    setCompletedCrop(null);
    if (!open || !source) {
      setUrl(null);
      return;
    }
    sourceToObjectUrl(source).then((u) => {
      if (cancelled) {
        if (u && u.startsWith("blob:")) URL.revokeObjectURL(u);
        return;
      }
      if (createdUrlRef.current && createdUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(createdUrlRef.current);
      }
      createdUrlRef.current = u;
      setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [open, source]);

  useEffect(() => {
    return () => {
      if (createdUrlRef.current && createdUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(createdUrlRef.current);
        createdUrlRef.current = null;
      }
    };
  }, []);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Default selection = full image so "Crop & Upload" without dragging just re-encodes.
    const initial: PixelCrop = { unit: "px", x: 0, y: 0, width: img.width, height: img.height };
    setCrop(initial);
    setCompletedCrop(initial);
  }, []);

  const handleSkip = () => {
    onResult(null);
    onOpenChange(false);
  };

  const handleCrop = async () => {
    if (!imgRef.current || !completedCrop || completedCrop.width < 2 || completedCrop.height < 2) {
      toast.error("Drag a selection on the image first");
      return;
    }
    setBusy(true);
    try {
      const mime =
        source instanceof File && source.type ? source.type :
        source instanceof Blob && source.type ? source.type :
        "image/jpeg";
      const blob = await cropToBlob(imgRef.current, completedCrop, mime);
      onResult(blob);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not crop image");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && open) onResult(null); // closing X = skip
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center bg-muted/40 rounded-lg p-3 min-h-[200px]">
          {url ? (
            <ReactCrop
              crop={crop}
              onChange={(_, percent) => setCrop(percent)}
              onComplete={(c) => setCompletedCrop(c)}
              keepSelection
            >
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <img
                ref={imgRef}
                src={url}
                crossOrigin="anonymous"
                onLoad={onImageLoad}
                className="max-h-[60vh] w-auto"
              />
            </ReactCrop>
          ) : (
            <p className="text-sm text-muted-foreground self-center">Loading image…</p>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Drag the corners to crop. Skip to use the original image.
        </p>
        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={handleSkip} disabled={busy}>
            Skip
          </Button>
          <Button type="button" onClick={handleCrop} disabled={busy || !url}>
            {busy ? "Cropping…" : "Crop & Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}