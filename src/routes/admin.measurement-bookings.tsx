import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/measurement-bookings")({
  head: () => ({ meta: [{ title: "Measurement Bookings — Suzy Wood Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminMeasurementBookings,
});

type Status = "new" | "contacted" | "visited" | "quoted" | "ordered" | "cancelled";

type Booking = {
  id: string;
  product_id: string | null;
  product_name: string;
  full_name: string;
  phone: string;
  area: string;
  address: string;
  preferred_day: string;
  time_slot: string;
  notes: string | null;
  status: Status;
  quoted_price: number | null;
  created_at: string;
};

const DAY_LABELS: Record<string, string> = {
  saturday: "Saturday", sunday: "Sunday", monday: "Monday",
  tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
};
const SLOT_LABELS: Record<string, string> = {
  morning: "Morning (9–12)", afternoon: "Afternoon (12–4)", evening: "Evening (4–8)",
};
const STATUS_COLOR: Record<Status, string> = {
  new: "bg-amber-100 text-amber-800 border-amber-200",
  contacted: "bg-blue-100 text-blue-800 border-blue-200",
  visited: "bg-indigo-100 text-indigo-800 border-indigo-200",
  quoted: "bg-purple-100 text-purple-800 border-purple-200",
  ordered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
};

function AdminMeasurementBookings() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});

  const load = async () => {
    const { data, error } = await supabase
      .from("measurement_bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Couldn't load measurement bookings");
    else setRows((data ?? []) as Booking[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("measurement-bookings-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "measurement_bookings" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const updateStatus = async (b: Booking, status: Status) => {
    const prev = b.status;
    setRows((r) => r.map((x) => x.id === b.id ? { ...x, status } : x));
    const { error } = await supabase.from("measurement_bookings").update({ status }).eq("id", b.id);
    if (error) {
      toast.error("Couldn't update status");
      setRows((r) => r.map((x) => x.id === b.id ? { ...x, status: prev } : x));
      return;
    }
    toast.success(`Marked as ${status}`);
  };

  const saveQuote = async (b: Booking) => {
    const raw = priceDrafts[b.id];
    const num = Number(raw);
    if (!raw || !Number.isFinite(num) || num <= 0) {
      toast.error("Enter a valid price");
      return;
    }
    const { error } = await supabase
      .from("measurement_bookings")
      .update({ quoted_price: num, status: "quoted" })
      .eq("id", b.id);
    if (error) { toast.error("Couldn't save quote"); return; }
    toast.success("Quote saved");
    setRows((r) => r.map((x) => x.id === b.id ? { ...x, quoted_price: num, status: "quoted" } : x));
    setPriceDrafts((d) => { const c = { ...d }; delete c[b.id]; return c; });
  };

  const whatsapp = (b: Booking) => {
    const msg = `Hi ${b.full_name}, regarding your measurement booking for ${b.product_name} — we'd like to confirm your visit.`;
    window.open(`https://wa.me/2${b.phone}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Measurement Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">Safety Gates and other custom-measurement requests.</p>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Booked</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Quote (EGP)</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={12}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground py-10">No measurement bookings yet</TableCell></TableRow>
            ) : rows.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.full_name}</TableCell>
                <TableCell className="font-mono text-xs">{b.phone}</TableCell>
                <TableCell>{b.area}</TableCell>
                <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={b.address}>{b.address}</TableCell>
                <TableCell className="max-w-[180px] truncate" title={b.product_name}>{b.product_name}</TableCell>
                <TableCell>{DAY_LABELS[b.preferred_day] ?? b.preferred_day}</TableCell>
                <TableCell>{SLOT_LABELS[b.time_slot] ?? b.time_slot}</TableCell>
                <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground" title={b.notes ?? ""}>{b.notes || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Select value={b.status} onValueChange={(v) => updateStatus(b, v as Status)}>
                    <SelectTrigger className={`h-8 w-32 border ${STATUS_COLOR[b.status]}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="visited">Visited</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                      <SelectItem value="ordered">Ordered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {b.status === "quoted" || b.quoted_price != null ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        className="h-8 w-28"
                        value={priceDrafts[b.id] ?? (b.quoted_price?.toString() ?? "")}
                        onChange={(e) => setPriceDrafts((d) => ({ ...d, [b.id]: e.target.value }))}
                      />
                      <Button size="sm" variant="outline" onClick={() => saveQuote(b)}>Save</Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => whatsapp(b)} title="Send WhatsApp">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}