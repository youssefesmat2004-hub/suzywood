import { useCallback, useRef, useState } from "react";
import { ImageCropDialog } from "@/components/ui/image-crop-dialog";

type Source = File | Blob | string;

/**
 * Imperative crop dialog. Mount {dialog} once in your tree, then:
 *   const blob = await open(fileOrUrl);
 *   if (blob) upload(blob);  // user cropped
 *   else if (blob === null && wasOriginalFile) upload(originalFile); // skipped
 *
 * Returns null when the user clicked "Skip" or closed the dialog.
 */
export function useImageCropper() {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<Source | null>(null);
  const [title, setTitle] = useState<string | undefined>(undefined);
  const resolverRef = useRef<((blob: Blob | null) => void) | null>(null);

  const openCropper = useCallback((src: Source, opts?: { title?: string }) => {
    setSource(src);
    setTitle(opts?.title);
    setOpen(true);
    return new Promise<Blob | null>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleResult = useCallback((blob: Blob | null) => {
    resolverRef.current?.(blob);
    resolverRef.current = null;
  }, []);

  const dialog = (
    <ImageCropDialog
      open={open}
      source={source}
      title={title}
      onOpenChange={setOpen}
      onResult={handleResult}
    />
  );

  return { open: openCropper, dialog };
}