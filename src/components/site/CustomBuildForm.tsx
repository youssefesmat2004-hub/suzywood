import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { notifyOwnerNewCustomBuild } from "@/lib/owner-notifications.functions";
import { submitCustomBuildRequest } from "@/lib/public-submissions.functions";
import { toast } from "sonner";
import { ImagePlus, X, Crop as CropIcon } from "lucide-react";
import { useImageCropper } from "@/hooks/use-image-cropper";

export function CustomBuildForm() {
  const [submitting, setSubmitting] = useState(false);
  const notifyOwner = useServerFn(notifyOwnerNewCustomBuild);
  const submit = useServerFn(submitCustomBuildRequest);
  const [room, setRoom] = useState("nursery");
  const [file, setFile] = useState<File | Blob | null>(null);
  const [fileName, setFileName] = useState<string>("inspo.jpg");
  const [preview, setPreview] = useState<string | null>(null);
  const cropper = useImageCropper();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) { setFile(null); setPreview(null); return; }
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose an image file"); return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB"); return;
    }
    const cropped = await cropper.open(f, { title: "Crop inspiration photo" });
    const finalFile = cropped ?? f;
    setFile(finalFile);
    setFileName(f.name);
    setPreview(URL.createObjectURL(finalFile));
    e.target.value = "";
  };

  const clearFile = () => { setFile(null); setPreview(null); };

  const recrop = async () => {
    if (!file) return;
    const cropped = await cropper.open(file, { title: "Re-crop inspiration photo" });
    if (!cropped) return;
    setFile(cropped);
    setPreview(URL.createObjectURL(cropped));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);

    let inspiration_image_url: string | null = null;
    if (file) {
      const ext = (fileName.split(".").pop() || file.type.split("/")[1] || "jpg").toLowerCase();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("inspiration-images")
        .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
      if (upErr) {
        setSubmitting(false);
        toast.error("Couldn't upload image", { description: upErr.message });
        return;
      }
      inspiration_image_url = supabase.storage.from("inspiration-images").getPublicUrl(path).data.publicUrl;
    }

    const payload = {
      full_name: String(fd.get("name")),
      email: String(fd.get("email")),
      phone: String(fd.get("phone")),
      room_type: room as "nursery" | "toddler" | "playroom" | "other",
      description: String(fd.get("idea")),
    };
    const res = await submit({
      data: { ...payload, inspiration_image_url },
    }).catch((err) => ({ ok: false as const, error: String(err?.message ?? err) }));
    setSubmitting(false);
    if (!res.ok) {
      toast.error("Couldn't send your request", { description: res.error });
    } else {
      notifyOwner({ data: { requestId: res.id } }).catch((err) =>
        console.error("Owner custom build notify failed", err),
      );
      toast.success("Request received", { description: "Our team will reach out within two working days." });
      (e.target as HTMLFormElement).reset();
      clearFile();
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {cropper.dialog}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="name">Full name</Label><Input id="name" name="name" required maxLength={100} /></div>
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" name="email" required maxLength={255} /></div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" required maxLength={20} /></div>
        <div className="space-y-2">
          <Label htmlFor="room">Room type</Label>
          <Select value={room} onValueChange={setRoom}>
            <SelectTrigger id="room"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nursery">Nursery</SelectItem>
              <SelectItem value="toddler">Toddler Room</SelectItem>
              <SelectItem value="playroom">Playroom</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2"><Label htmlFor="idea">Tell us about your bespoke piece</Label><Textarea id="idea" name="idea" rows={5} minLength={10} maxLength={2000} required placeholder="Dimensions, finish, style references…" /></div>
      <div className="space-y-2">
        <Label htmlFor="inspo">Inspiration photo <span className="text-muted-foreground font-normal">(optional · max 5MB)</span></Label>
        {preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="Inspiration preview" className="h-40 w-40 object-cover rounded-xl border border-border" />
            <button type="button" onClick={recrop} className="absolute -top-2 -left-2 h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center shadow-card" aria-label="Crop image">
              <CropIcon className="h-4 w-4" />
            </button>
            <button type="button" onClick={clearFile} className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center shadow-card" aria-label="Remove image">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label htmlFor="inspo" className="flex items-center gap-3 cursor-pointer border border-dashed border-border rounded-xl px-4 py-6 hover:bg-muted/40 transition-colors">
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Click to attach a reference photo (JPG, PNG, WEBP)</span>
          </label>
        )}
        <input id="inspo" type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      </div>
      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">{submitting ? "Sending…" : "Submit Request"}</Button>
    </form>
  );
}
