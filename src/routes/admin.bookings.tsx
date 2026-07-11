import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppLink, firstName } from "@/lib/whatsapp";

export const Route = createFileRoute("/admin/bookings")({
  head: () => ({ meta: [{ title: "Bookings — Suzy Wood Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminBookings,
});

type Booking = {
  id: string;
  full_name: string;
  phone: string;
  contact_method: "whatsapp" | "phone";
  preferred_day: string;
  time_slot: string;
  notes: string | null;
  status: "new" | "contacted" | "done";
  created_at: string;
};

const DAY_LABELS: Record<string, string> = {
  saturday: "Saturday", sunday: "Sunday", monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
};
const SLOT_LABELS: Record<string, string> = {
  morning: "Morning (9–12)", afternoon: "Afternoon (12–4)", evening: "Evening (4–8)",
};
const STATUS_COLOR: Record<string, string> = {
  new: "bg-amber-100 text-amber-800 border-amber-200",
  contacted: "bg-blue-100 text-blue-800 border-blue-200",
  done: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Couldn't load bookings");
    else setBookings((data ?? []) as Booking[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("bookings-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const sendContactedWhatsApp = (b: Booking) => {
    const message = `Hi ${b.full_name}, we will be reaching out to you shortly to confirm your session appointment 🪴`;
    const url = `https://wa.me/2${b.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const updateStatus = async (b: Booking, status: Booking["status"]) => {
    const prev = b.status;
    setBookings((rows) => rows.map((r) => (r.id === b.id ? { ...r, status } : r)));
    const { error } = await supabase.from("bookings").update({ status }).eq("id", b.id);
    if (error) {
      toast.error("Couldn't update status");
      setBookings((rows) => rows.map((r) => (r.id === b.id ? { ...r, status: prev } : r)));
      return;
    }
    toast.success(`Marked as ${status}`);
    if (status === "contacted" && prev !== "contacted") {
      sendContactedWhatsApp(b);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">Free guidance session requests.</p>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Booked</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={9}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
              ))
            ) : bookings.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-10">No bookings yet</TableCell></TableRow>
            ) : bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.full_name}</TableCell>
                <TableCell className="font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span>{b.phone}</span>
                    <WhatsAppLink
                      phone={b.phone}
                      message={`Hi ${firstName(b.full_name)}, this is Suzy Wood — about your free guidance session (${DAY_LABELS[b.preferred_day] ?? b.preferred_day}, ${SLOT_LABELS[b.time_slot] ?? b.time_slot}).`}
                      label="Chat on WhatsApp"
                    />
                  </div>
                </TableCell>
                <TableCell className="capitalize">{b.contact_method === "whatsapp" ? "WhatsApp" : "Phone"}</TableCell>
                <TableCell>{DAY_LABELS[b.preferred_day] ?? b.preferred_day}</TableCell>
                <TableCell>{SLOT_LABELS[b.time_slot] ?? b.time_slot}</TableCell>
                <TableCell className="max-w-xs truncate text-xs text-muted-foreground" title={b.notes ?? ""}>{b.notes || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Select value={b.status} onValueChange={(v) => updateStatus(b, v as Booking["status"])}>
                    <SelectTrigger className={`h-8 w-32 border ${STATUS_COLOR[b.status]}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => sendContactedWhatsApp(b)} title="Send WhatsApp">
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