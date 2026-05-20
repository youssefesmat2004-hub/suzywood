import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, X, Image as ImageIcon, Lock, Mail, Store, Wallet, QrCode } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { resolveImage } from "@/lib/images";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

const CURRENCIES = ["EGP", "USD", "EUR", "SAR", "AED", "GBP"];

async function uploadFile(file: File, folder: string): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    toast.error(error.message);
    return null;
  }
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Store settings
  const [storeName, setStoreName] = useState("");
  const [storeLogo, setStoreLogo] = useState<string>("");
  const [currency, setCurrency] = useState("EGP");
  const [instapayQr, setInstapayQr] = useState<string>("");
  const [savingStore, setSavingStore] = useState(false);

  // Account
  const [email, setEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const logoRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_content")
        .select("key,value")
        .in("key", ["store_name", "store_logo_url", "default_currency", "instapay_qr_url"]);
      const map = new Map((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
      setStoreName(map.get("store_name") ?? "");
      setStoreLogo(map.get("store_logo_url") ?? "");
      setCurrency(map.get("default_currency") || "EGP");
      setInstapayQr(map.get("instapay_qr_url") ?? "");
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  const upsert = async (key: string, value: string) => {
    // try update first, then insert if it didn't exist
    const { error, count } = await supabase
      .from("site_content")
      .update({ value }, { count: "exact" })
      .eq("key", key);
    if (error) throw error;
    if (!count) {
      const { error: insErr } = await supabase.from("site_content").insert({ key, value });
      if (insErr) throw insErr;
    }
  };

  const saveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStore(true);
    try {
      await Promise.all([
        upsert("store_name", storeName),
        upsert("store_logo_url", storeLogo),
        upsert("default_currency", currency),
        upsert("instapay_qr_url", instapayQr),
      ]);
      toast.success("Store settings saved");
    } catch (err) {
      toast.error("Something went wrong, please try again");
      console.error(err);
    } finally {
      setSavingStore(false);
    }
  };

  const saveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Email is required");
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email });
    setSavingEmail(false);
    if (error) {
      toast.error(error.message || "Something went wrong, please try again");
      return;
    }
    toast.success("Email update requested — check your inbox to confirm");
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error("Password must be at least 8 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message || "Something went wrong, please try again");
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated");
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    const url = await uploadFile(file, "branding");
    setUploadingLogo(false);
    if (url) setStoreLogo(url);
  };

  const handleQrUpload = async (file: File) => {
    setUploadingQr(true);
    const url = await uploadFile(file, "instapay");
    setUploadingQr(false);
    if (url) setInstapayQr(url);
  };

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Settings</h1>
      <p className="text-sm text-muted-foreground mb-8">Manage your store, branding and admin account.</p>

      <div className="grid gap-6 max-w-3xl">
        {/* Store */}
        <form onSubmit={saveStore} className="bg-background border rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Store className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl">Store</h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-24" />
              <Skeleton className="h-10 w-40" />
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Store name</Label>
                <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Suzy Wood" />
              </div>

              <div className="space-y-1.5">
                <Label>Store logo</Label>
                <div className="flex items-start gap-4">
                  <div className="h-24 w-24 rounded-lg border-2 border-dashed bg-muted/30 flex items-center justify-center overflow-hidden">
                    {storeLogo ? (
                      <img src={resolveImage(storeLogo)} alt="logo" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input ref={logoRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                    <Button type="button" variant="outline" size="sm" onClick={() => logoRef.current?.click()} disabled={uploadingLogo}>
                      <Upload className="h-3.5 w-3.5 mr-2" /> {uploadingLogo ? "Uploading…" : "Upload"}
                    </Button>
                    {storeLogo && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setStoreLogo("")}>
                        <X className="h-3.5 w-3.5 mr-2" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Default currency</Label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <p className="text-xs text-muted-foreground">Used in pricing displays across the site.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><QrCode className="h-3.5 w-3.5" /> InstaPay QR code</Label>
                <div className="flex items-start gap-4">
                  <div className="h-32 w-32 rounded-lg border-2 border-dashed bg-muted/30 flex items-center justify-center overflow-hidden">
                    {instapayQr ? (
                      <img src={resolveImage(instapayQr)} alt="QR" className="w-full h-full object-contain" />
                    ) : (
                      <QrCode className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input ref={qrRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleQrUpload(e.target.files[0])} />
                    <Button type="button" variant="outline" size="sm" onClick={() => qrRef.current?.click()} disabled={uploadingQr}>
                      <Upload className="h-3.5 w-3.5 mr-2" /> {uploadingQr ? "Uploading…" : "Upload"}
                    </Button>
                    {instapayQr && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setInstapayQr("")}>
                        <X className="h-3.5 w-3.5 mr-2" /> Remove
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Shown to customers at checkout for payment.</p>
              </div>

              <Button type="submit" disabled={savingStore}>{savingStore ? "Saving…" : "Save Store Settings"}</Button>
            </>
          )}
        </form>

        {/* Email */}
        <form onSubmit={saveEmail} className="bg-background border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl">Admin Email</h2>
          </div>
          <div className="space-y-1.5">
            <Label>Email address</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <p className="text-xs text-muted-foreground">You'll receive a confirmation link at the new address.</p>
          </div>
          <Button type="submit" variant="outline" disabled={savingEmail}>{savingEmail ? "Updating…" : "Update Email"}</Button>
        </form>

        {/* Password */}
        <form onSubmit={savePassword} className="bg-background border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl">Change Password</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm new password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required />
            </div>
          </div>
          <Button type="submit" variant="outline" disabled={savingPassword}>{savingPassword ? "Updating…" : "Update Password"}</Button>
        </form>
      </div>
    </div>
  );
}