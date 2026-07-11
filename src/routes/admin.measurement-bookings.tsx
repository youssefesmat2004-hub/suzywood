import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Check, CheckCircle2, Send, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { sendMeasurementBookingEmail } from "@/lib/measurement-booking-emails.functions";
import { WhatsAppLink, firstName } from "@/lib/whatsapp";

export const Route = createFileRoute("/admin/measurement-bookings")({
  head: () => ({ meta: [{ title: "Measurement Bookings — Suzy Wood Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminMeasurementBookings,
});

type BookingStatus = "received" | "date_confirmed" | "quotation_sent" | "payment_confirmed" | "installed";

type Booking = {
  id: string;
  product_id: string | null;
  product_name: string;
  full_name: string;
  customer_email: string | null;
  phone: string;
  area: string;
  address: string;
  preferred_day: string;
  time_slot: string;
  notes: string | null;
  booking_status: BookingStatus;
  confirmed_date: string | null;
  quotation_price: number | null;
  payment_link: string | null;
  confirmed_email_sent_at: string | null;
  quotation_email_sent_at: string | null;
  payment_email_sent_at: string | null;
  installed_email_sent_at: string | null;
  created_at: string;
};

const DAY_LABELS: Record<string, string> = {
  saturday: "Saturday", sunday: "Sunday", monday: "Monday",
  tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
};
const SLOT_LABELS: Record<string, string> = {
  morning: "Morning (9–12)", afternoon: "Afternoon (12–4)", evening: "Evening (4–8)",
};
const STATUS_META: Record<BookingStatus, { label: string; cls: string }> = {
  received:           { label: "Booking Received",  cls: "bg-amber-100 text-amber-800 border-amber-200" },
  date_confirmed:     { label: "Date Confirmed",    cls: "bg-blue-100 text-blue-800 border-blue-200" },
  quotation_sent:     { label: "Quotation Sent",    cls: "bg-purple-100 text-purple-800 border-purple-200" },
  payment_confirmed:  { label: "Payment Confirmed", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  installed:          { label: "Installed",         cls: "bg-slate-200 text-slate-800 border-slate-300" },
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdminMeasurementBookings() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateDrafts, setDateDrafts] = useState<Record<string, string>>({});
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const sendEmail = useServerFn(sendMeasurementBookingEmail);

  const load = async () => {
    const { data, error } = await supabase
      .from("measurement_bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Couldn't load measurement bookings");
    else setRows(((data ?? []) as unknown) as Booking[]);
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

  const setBusyFor = (id: string, v: boolean) =>
    setBusy((p) => ({ ...p, [id]: v }));

  const confirmDate = async (b: Booking) => {
    const raw = dateDrafts[b.id] ?? toLocalInput(b.confirmed_date);
    if (!raw) return toast.error("Pick a date and time first");
    const iso = new Date(raw).toISOString();
    setBusyFor(b.id, true);
    const { error } = await supabase
      .from("measurement_bookings")
      .update({ confirmed_date: iso, booking_status: "date_confirmed" } as never)
      .eq("id", b.id);
    if (error) { setBusyFor(b.id, false); toast.error("Couldn't confirm date", { description: error.message }); return; }
    setBusyFor(b.id, false);
    toast.success("Date confirmed — customer not notified yet");
    load();
  };

  const sendQuotation = async (b: Booking) => {
    const rawPrice = priceDrafts[b.id] ?? (b.quotation_price?.toString() ?? "");
    const link = (linkDrafts[b.id] ?? b.payment_link ?? "").trim();
    const num = Number(rawPrice);
    if (!rawPrice || !Number.isFinite(num) || num <= 0) return toast.error("Enter a valid quotation price");
    if (!link) return toast.error("Enter a payment link or instructions");
    setBusyFor(b.id, true);
    const { error } = await supabase
      .from("measurement_bookings")
      .update({ quotation_price: num, payment_link: link, booking_status: "quotation_sent" } as never)
      .eq("id", b.id);
    if (error) { setBusyFor(b.id, false); toast.error("Couldn't save quotation", { description: error.message }); return; }
    setBusyFor(b.id, false);
    toast.success("Quotation saved — customer not notified yet");
    load();
  };

  const markPaid = async (b: Booking) => {
    setBusyFor(b.id, true);
    const { error } = await supabase
      .from("measurement_bookings")
      .update({ booking_status: "payment_confirmed" } as never)
      .eq("id", b.id);
    if (error) { setBusyFor(b.id, false); toast.error("Couldn't update status"); return; }
    setBusyFor(b.id, false);
    toast.success("Marked as paid — customer not notified yet");
    load();
  };

  const notify = async (b: Booking, kind: "confirmed" | "quotation" | "paid" | "installed") => {
    const sentAt =
      kind === "confirmed" ? b.confirmed_email_sent_at :
      kind === "quotation" ? b.quotation_email_sent_at :
      kind === "paid"      ? b.payment_email_sent_at :
      b.installed_email_sent_at;
    if (sentAt && !confirm("Customer was already notified for this. Send again?")) return;
    setBusyFor(b.id, true);
    const res = await sendEmail({ data: { bookingId: b.id, kind } });
    setBusyFor(b.id, false);
    if (!res?.ok) toast.error("Email failed", { description: (res as { error?: string })?.error });
    else { toast.success("Customer notified by email"); load(); }
  };

  const markInstalled = async (b: Booking) => {
    setBusyFor(b.id, true);
    const { error } = await supabase
      .from("measurement_bookings")
      .update({ booking_status: "installed" } as never)
      .eq("id", b.id);
    setBusyFor(b.id, false);
    if (error) { toast.error("Couldn't update status"); return; }
    toast.success("Marked as installed");
    load();
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

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border bg-card py-12 text-center text-muted-foreground">No measurement bookings yet</div>
      ) : (
        <div className="grid gap-4">
          {rows.map((b) => {
            const status = STATUS_META[b.booking_status] ?? STATUS_META.received;
            const isBusy = !!busy[b.id];
            return (
              <div key={b.id} className="rounded-xl border bg-card p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-medium text-lg">{b.full_name}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${status.cls}`}>{status.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{b.product_name} · Booked {new Date(b.created_at).toLocaleString()}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => whatsapp(b)}>
                    <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
                  </Button>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Email:</span> {b.customer_email || <span className="text-rose-600">missing</span>}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-mono">{b.phone}</span>
                    <WhatsAppLink
                      phone={b.phone}
                      message={`Hi ${firstName(b.full_name)}, this is Suzy Wood — about your measurement booking${b.product_name ? ` for the ${b.product_name}` : ""}.`}
                    />
                  </div>
                  <div><span className="text-muted-foreground">Area:</span> {b.area}</div>
                  <div><span className="text-muted-foreground">Preferred:</span> {DAY_LABELS[b.preferred_day] ?? b.preferred_day} · {SLOT_LABELS[b.time_slot] ?? b.time_slot}</div>
                  <div className="sm:col-span-2"><span className="text-muted-foreground">Address:</span> {b.address}</div>
                  {b.notes && <div className="sm:col-span-2"><span className="text-muted-foreground">Notes:</span> {b.notes}</div>}
                </div>

                {/* Stage 1 → Confirm date */}
                <div className="rounded-lg border p-3 bg-muted/30">
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="flex-1 min-w-[220px] space-y-1">
                      <Label className="text-xs">Confirmed date &amp; time</Label>
                      <Input
                        type="datetime-local"
                        value={dateDrafts[b.id] ?? toLocalInput(b.confirmed_date)}
                        onChange={(e) => setDateDrafts((d) => ({ ...d, [b.id]: e.target.value }))}
                      />
                    </div>
                    <Button size="sm" disabled={isBusy} onClick={() => confirmDate(b)}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Confirm Date
                    </Button>
                    <Button size="sm" variant="outline" disabled={isBusy || !b.confirmed_date} onClick={() => notify(b, "confirmed")}>
                      <Send className="h-4 w-4 mr-1" /> Send Confirmation to Customer
                    </Button>
                  </div>
                  {b.confirmed_email_sent_at && (
                    <p className="text-xs text-emerald-700 mt-2 flex items-center gap-1"><Check className="h-3 w-3" /> Notified · {new Date(b.confirmed_email_sent_at).toLocaleString()}</p>
                  )}
                </div>

                {/* Stage 2 → Quotation */}
                <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Quotation price (EGP)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={priceDrafts[b.id] ?? (b.quotation_price?.toString() ?? "")}
                        onChange={(e) => setPriceDrafts((d) => ({ ...d, [b.id]: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Payment link / instructions</Label>
                      <Textarea
                        rows={2}
                        value={linkDrafts[b.id] ?? (b.payment_link ?? "")}
                        onChange={(e) => setLinkDrafts((d) => ({ ...d, [b.id]: e.target.value }))}
                        placeholder="InstaPay link or instructions"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" disabled={isBusy} onClick={() => sendQuotation(b)}>
                      <Send className="h-4 w-4 mr-1" /> Save Quotation
                    </Button>
                    <Button size="sm" variant="outline" className="ml-2" disabled={isBusy || !b.quotation_price} onClick={() => notify(b, "quotation")}>
                      <Send className="h-4 w-4 mr-1" /> Send Quotation Email
                    </Button>
                  </div>
                  {b.quotation_email_sent_at && (
                    <p className="text-xs text-emerald-700 flex items-center gap-1"><Check className="h-3 w-3" /> Notified · {new Date(b.quotation_email_sent_at).toLocaleString()}</p>
                  )}
                </div>

                {/* Stage 3 → Mark paid / installed */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" disabled={isBusy || b.booking_status === "payment_confirmed" || b.booking_status === "installed"} onClick={() => markPaid(b)}>
                    <BadgeCheck className="h-4 w-4 mr-1" /> Mark as Paid
                  </Button>
                  <Button size="sm" variant="outline" disabled={isBusy || b.booking_status !== "payment_confirmed"} onClick={() => notify(b, "paid")}>
                    <Send className="h-4 w-4 mr-1" /> Notify Customer Payment Received
                  </Button>
                  <Button size="sm" variant="outline" disabled={isBusy || b.booking_status === "installed"} onClick={() => markInstalled(b)}>
                    Mark as Installed
                  </Button>
                  <Button size="sm" variant="outline" disabled={isBusy || b.booking_status !== "installed"} onClick={() => notify(b, "installed")}>
                    <Send className="h-4 w-4 mr-1" /> Notify Customer Installed
                  </Button>
                  {b.payment_email_sent_at && (
                    <span className="text-xs text-emerald-700 flex items-center gap-1"><Check className="h-3 w-3" /> Notified · {new Date(b.payment_email_sent_at).toLocaleString()}</span>
                  )}
                  {b.installed_email_sent_at && (
                    <span className="text-xs text-emerald-700 flex items-center gap-1"><Check className="h-3 w-3" /> Installed notified · {new Date(b.installed_email_sent_at).toLocaleString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}