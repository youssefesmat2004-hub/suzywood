import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Suzy Wood" },
      { name: "description", content: "Choose a new password for your Suzy Wood account." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const schema = z
    .object({
      password: z.string().min(8, t("checkout.passwordMinChars", "Password must be at least 8 characters")).max(200),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, { message: t("checkout.passwordsDoNotMatch", "Passwords do not match") });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Supabase delivers a recovery session via the URL hash / PKCE code.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({ password: fd.get("password"), confirm: fd.get("confirm") });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error: updErr } = await supabase.auth.updateUser({ password: parsed.data.password });
    setLoading(false);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    toast.success(t("checkout.passwordUpdated", "Password updated — please sign in"));
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md bg-background border rounded-2xl shadow-elegant p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-serif text-2xl">{t("checkout.setNewPassword", "Set a new password")}</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            {ready
              ? t("checkout.chooseNewPasswordNote", "Choose a new password for your account.")
              : t("checkout.openFromResetLink", "Open this page from the reset link in your email.")}
          </p>
        </div>
        {ready ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("checkout.newPassword", "New password")}</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">{t("checkout.confirmPassword", "Confirm password")}</Label>
              <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("checkout.updating", "Updating…") : t("checkout.updatePassword", "Update password")}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            {t("checkout.linkExpiredNote", "This link may have expired. Request a new one from the admin login page.")}
          </p>
        )}
      </div>
    </div>
  );
}