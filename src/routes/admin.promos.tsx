import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/promos")({
  component: PromosPage,
});

type Promo = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_subtotal: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

function PromosPage() {
  const [list, setList] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("10");
  const [minSub, setMinSub] = useState("0");
  const [maxUses, setMaxUses] = useState("");
  const [expires, setExpires] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
    setList((data ?? []) as Promo[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("promo_codes").insert({
      code: code.trim().toUpperCase(),
      discount_type: type,
      discount_value: Number(value),
      min_subtotal: Number(minSub || 0),
      max_uses: maxUses ? Number(maxUses) : null,
      expires_at: expires ? new Date(expires).toISOString() : null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Promo code created");
    setCode(""); setValue("10"); setMinSub("0"); setMaxUses(""); setExpires("");
    load();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("promo_codes").update({ is_active: active }).eq("id", id);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;
    await supabase.from("promo_codes").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Promo Codes</h1>
      <p className="text-sm text-muted-foreground mb-8">Create discount codes for customers to use at checkout.</p>

      <form onSubmit={create} className="rounded-2xl border border-border bg-card p-6 grid sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-10">
        <div className="space-y-1 lg:col-span-2">
          <Label>Code</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WELCOME10" required maxLength={40} />
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v: "percent" | "fixed") => setType(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Percent %</SelectItem>
              <SelectItem value="fixed">Fixed EGP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Value</Label>
          <Input type="number" min="1" value={value} onChange={(e) => setValue(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Min Subtotal</Label>
          <Input type="number" min="0" value={minSub} onChange={(e) => setMinSub(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Max Uses</Label>
          <Input type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="∞" />
        </div>
        <div className="space-y-1 lg:col-span-2">
          <Label>Expires</Label>
          <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
        </div>
        <div className="flex items-end lg:col-span-1">
          <Button type="submit" className="w-full gap-2" disabled={busy}><Plus className="h-4 w-4" />Create</Button>
        </div>
      </form>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No promo codes yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Min</th>
                <th className="p-3">Usage</th>
                <th className="p-3">Expires</th>
                <th className="p-3">Active</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3 font-mono font-medium">{p.code}</td>
                  <td className="p-3">{p.discount_type === "percent" ? `${p.discount_value}%` : `EGP ${p.discount_value}`}</td>
                  <td className="p-3">EGP {Number(p.min_subtotal).toLocaleString()}</td>
                  <td className="p-3">{p.used_count}{p.max_uses ? ` / ${p.max_uses}` : ""}</td>
                  <td className="p-3">{p.expires_at ? new Date(p.expires_at).toLocaleDateString() : "—"}</td>
                  <td className="p-3"><Switch checked={p.is_active} onCheckedChange={(c) => toggle(p.id, c)} /></td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}