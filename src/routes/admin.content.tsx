import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Row = { key: string; value: string; description: string | null };

const FIELDS: { key: string; label: string; type: "input" | "textarea"; help: string }[] = [
  { key: "hero_title", label: "Homepage Hero Title", type: "textarea", help: "Main headline on the homepage." },
  { key: "hero_subtitle", label: "Homepage Hero Subtitle", type: "textarea", help: "Supporting text under the hero title." },
  { key: "announcement_banner", label: "Announcement Banner", type: "input", help: "Site-wide banner above the header. Leave empty to hide." },
  { key: "footer_tagline", label: "Footer Tagline", type: "textarea", help: "Brand description in the footer." },
  { key: "contact_email", label: "Contact Email", type: "input", help: "Public contact email shown in footer & contact page." },
  { key: "contact_phone", label: "Contact Phone", type: "input", help: "Public phone number shown in footer." },
];

export const Route = createFileRoute("/admin/content")({
  component: ContentEditor,
});

function ContentEditor() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_content").select("key,value,description");
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: Row) => (map[r.key] = r.value));
      setValues(map);
      setLoading(false);
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const updates = FIELDS.map((f) =>
      supabase.from("site_content").update({ value: values[f.key] ?? "" }).eq("key", f.key),
    );
    const results = await Promise.all(updates);
    setSaving(false);
    const err = results.find((r) => r.error);
    if (err?.error) {
      toast.error(err.error.message);
      return;
    }
    toast.success("Content saved — your website is updated.");
  };

  if (loading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Edit Content</h1>
      <p className="text-sm text-muted-foreground mb-8">Changes update on the live website immediately.</p>
      <form onSubmit={save} className="space-y-6 max-w-2xl">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={f.key}>{f.label}</Label>
            {f.type === "textarea" ? (
              <Textarea
                id={f.key}
                rows={3}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            ) : (
              <Input
                id={f.key}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            )}
            <p className="text-xs text-muted-foreground">{f.help}</p>
          </div>
        ))}
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
      </form>
    </div>
  );
}