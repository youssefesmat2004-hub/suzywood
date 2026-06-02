import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, Loader2, CheckCircle2, Hammer, Package, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { verifyCarpenterPin } from "@/lib/carpenter.functions";
import { playCarpenterAlert, unlockCarpenterAudio } from "@/lib/carpenter-sound";

export type CarpenterId = 1 | 2 | 3;

type WorkStatus = "confirmed" | "in_production" | "delivered";

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  size: string | null;
  finish: string | null;
  engraving: string | null;
  custom_width_cm: number | null;
  custom_length_cm: number | null;
};

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string | null;
  status: WorkStatus | string;
  created_at: string;
  shipping_notes: string | null;
  assigned_carpenter: number | null;
  order_items: OrderItem[];
};

const TABS: { value: WorkStatus; label: string }[] = [
  { value: "confirmed", label: "قيد الانتظار" },
  { value: "in_production", label: "جاري العمل" },
  { value: "delivered", label: "تم الانتهاء" },
];

// Carpenter view — non-financial columns only. Do NOT add: subtotal,
// shipping_fee, total, upfront_amount, remaining_amount, payment_method,
// instapay_reference, payment_proof_url, internal_notes, customer_email,
// shipping_address.
const ORDER_SELECT =
  "id, order_number, customer_name, customer_phone, status, created_at, shipping_notes, assigned_carpenter, order_items(id, product_name, quantity, size, finish, engraving, custom_width_cm, custom_length_cm)";

export function CarpenterDashboard({
  carpenterId,
  carpenterName,
}: {
  carpenterId: CarpenterId;
  carpenterName: string;
}) {
  const sessionKey = `carpenter_pin_ok_v2_${carpenterId}`;
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(sessionKey) === "1";
  });
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!unlocked) return;
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSignedIn(!!data.session);
      if (!data.session) {
        window.localStorage.removeItem(sessionKey);
        setUnlocked(false);
      }
    })();
  }, [unlocked, sessionKey]);

  if (!unlocked || !signedIn) {
    return (
      <PinGate
        carpenterId={carpenterId}
        carpenterName={carpenterName}
        onUnlocked={() => {
          window.localStorage.setItem(sessionKey, "1");
          setUnlocked(true);
          setSignedIn(true);
        }}
      />
    );
  }

  return <Dashboard carpenterId={carpenterId} carpenterName={carpenterName} />;
}

/* ------------------------------ PIN GATE ------------------------------ */

function PinGate({
  carpenterId,
  carpenterName,
  onUnlocked,
}: {
  carpenterId: CarpenterId;
  carpenterName: string;
  onUnlocked: () => void;
}) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const verify = useServerFn(verifyCarpenterPin);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async (value: string) => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    unlockCarpenterAudio();
    try {
      const res = await verify({ data: { pin: value, carpenterId } });
      if (!res.ok) {
        setErr("الرمز غير صحيح");
        setPin("");
        setBusy(false);
        return;
      }
      const { error } = await supabase.auth.setSession({
        access_token: res.accessToken,
        refresh_token: res.refreshToken,
      });
      if (error) throw error;
      onUnlocked();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "حدث خطأ");
      setBusy(false);
    }
  };

  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen bg-background flex items-center justify-center p-6 font-sans"
      style={{ fontFamily: "'Cairo','Tajawal',system-ui,sans-serif" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Hammer className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{carpenterName}</h1>
          <p className="text-sm text-muted-foreground mt-1">أدخل الرمز للدخول</p>
        </div>

        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <input
            ref={inputRef}
            value={pin}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            autoComplete="one-time-code"
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 4);
              setPin(v);
              if (v.length === 4) void submit(v);
            }}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.focus()}
            className="grid grid-cols-4 gap-3 w-full"
            aria-label="إدخال الرمز"
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`aspect-square rounded-xl border-2 text-3xl font-semibold flex items-center justify-center ${
                  i < pin.length ? "border-primary bg-primary/5" : "border-border bg-background"
                }`}
              >
                {pin[i] ? "•" : ""}
              </div>
            ))}
          </button>

          {err && <p className="mt-4 text-center text-sm text-destructive">{err}</p>}
          {busy && (
            <div className="mt-4 flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
              جاري التحقق…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ DASHBOARD ------------------------------ */

function Dashboard({ carpenterId, carpenterName }: { carpenterId: CarpenterId; carpenterName: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<WorkStatus>("confirmed");
  const [badge, setBadge] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("assigned_carpenter", carpenterId)
      .in("status", ["confirmed", "in_production", "delivered"])
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setOrders((data ?? []) as unknown as Order[]);
    setLoading(false);
  }, [carpenterId]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`carpenter-orders-${carpenterId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        async (payload) => {
          const newRow = payload.new as { id: string; status: string; customer_name: string; assigned_carpenter: number | null };
          const oldRow = payload.old as { status: string; assigned_carpenter: number | null };

          // If the update doesn't concern this carpenter (either before or after), ignore.
          if (newRow.assigned_carpenter !== carpenterId && oldRow.assigned_carpenter !== carpenterId) {
            return;
          }

          const becameMine =
            newRow.assigned_carpenter === carpenterId &&
            (oldRow.assigned_carpenter !== carpenterId || (newRow.status === "confirmed" && oldRow.status !== "confirmed"));

          // If it was reassigned away from us, remove from list.
          if (oldRow.assigned_carpenter === carpenterId && newRow.assigned_carpenter !== carpenterId) {
            setOrders((prev) => prev.filter((o) => o.id !== newRow.id));
            return;
          }

          const { data } = await supabase
            .from("orders")
            .select(ORDER_SELECT)
            .eq("id", newRow.id)
            .maybeSingle();

          setOrders((prev) => {
            const without = prev.filter((o) => o.id !== newRow.id);
            if (!data) return without;
            const o = data as unknown as Order;
            if (o.assigned_carpenter !== carpenterId) return without;
            if (!["confirmed", "in_production", "delivered"].includes(o.status)) return without;
            return [o, ...without].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          });

          if (becameMine && newRow.status === "confirmed") {
            setBadge((b) => b + 1);
            playCarpenterAlert();
            toast.success(`لديك طلب جديد جاهز للعمل! — ${newRow.customer_name}`, { duration: 6000 });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          const row = payload.new as { id: string; status: string; customer_name: string; assigned_carpenter: number | null };
          if (row.assigned_carpenter !== carpenterId || row.status !== "confirmed") return;
          const { data } = await supabase.from("orders").select(ORDER_SELECT).eq("id", row.id).maybeSingle();
          if (!data) return;
          setOrders((prev) => [data as unknown as Order, ...prev.filter((o) => o.id !== row.id)]);
          setBadge((b) => b + 1);
          playCarpenterAlert();
          toast.success(`لديك طلب جديد جاهز للعمل! — ${row.customer_name}`, { duration: 6000 });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [carpenterId]);

  const counts = useMemo(() => {
    const c = { confirmed: 0, in_production: 0, delivered: 0 } as Record<WorkStatus, number>;
    for (const o of orders) {
      if (o.status in c) c[o.status as WorkStatus]++;
    }
    return c;
  }, [orders]);

  const filtered = useMemo(() => orders.filter((o) => o.status === tab), [orders, tab]);

  const updateStatus = async (id: string, next: WorkStatus) => {
    setUpdatingId(id);
    const { error } = await supabase.from("orders").update({ status: next }).eq("id", id);
    setUpdatingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next === "in_production" ? "تم بدء العمل" : "تم إنهاء الطلب");
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: next } : o)));
  };

  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen bg-muted/30"
      style={{ fontFamily: "'Cairo','Tajawal',system-ui,sans-serif" }}
    >
      <header className="sticky top-0 z-20 bg-background border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Hammer className="w-4 h-4 text-primary" />
            </div>
            <h1 className="font-bold text-base truncate">{carpenterName}</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              setBadge(0);
              setTab("confirmed");
            }}
            className="relative p-2 rounded-lg hover:bg-muted"
            aria-label="الإشعارات"
          >
            <Bell className="w-5 h-5" />
            {badge > 0 && (
              <span className="absolute -top-1 -left-1 min-w-[20px] h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold flex items-center justify-center">
                {badge}
              </span>
            )}
          </button>
        </div>

        <div className="max-w-2xl mx-auto px-2 pb-2 flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setTab(t.value);
                if (t.value === "confirmed") setBadge(0);
              }}
              className={`relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${
                tab === t.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-muted"
              }`}
            >
              {t.label}
              <span
                className={`ms-2 inline-flex items-center justify-center min-w-5 h-5 rounded-full text-[11px] ${
                  tab === t.value ? "bg-primary-foreground/20" : "bg-muted"
                }`}
              >
                {counts[t.value] ?? 0}
              </span>
              {t.value === "confirmed" && badge > 0 && (
                <span className="absolute -top-1 -left-1 min-w-[20px] h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold flex items-center justify-center shadow">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin ml-2" />
            جاري التحميل…
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
            لا توجد طلبات في هذا القسم
          </div>
        )}
        {filtered.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            busy={updatingId === o.id}
            onAdvance={(next) => updateStatus(o.id, next)}
          />
        ))}
      </main>
    </div>
  );
}

/* ------------------------------ ORDER CARD ------------------------------ */

function normalizeEgPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return digits;
}

function OrderCard({
  order,
  busy,
  onAdvance,
}: {
  order: Order;
  busy: boolean;
  onAdvance: (next: WorkStatus) => void;
}) {
  const dateText = new Date(order.created_at).toLocaleString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const daysSince = Math.max(
    0,
    Math.floor((Date.now() - new Date(order.created_at).getTime()) / 86_400_000)
  );
  const daysLabel =
    daysSince === 0
      ? "اليوم"
      : daysSince === 1
      ? "منذ يوم"
      : daysSince === 2
      ? "منذ يومين"
      : daysSince <= 10
      ? `منذ ${daysSince} أيام`
      : `منذ ${daysSince} يوماً`;
  const urgencyClass =
    daysSince >= 7
      ? "bg-red-100 text-red-700 border-red-200"
      : daysSince >= 3
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : "bg-muted text-foreground border-border";

  const waPhone = normalizeEgPhone(order.customer_phone);
  const waMessage = `مرحباً ${order.customer_name}، بخصوص طلبك رقم ${order.order_number} من Suzy Wood.`;
  const waHref = waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}` : null;
  const telHref = order.customer_phone ? `tel:${order.customer_phone}` : null;

  return (
    <article className="bg-card border rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground mb-1">اسم العميل</div>
          <div className="font-semibold text-lg leading-tight truncate">{order.customer_name}</div>
        </div>
        <div className="text-left shrink-0">
          <div className="text-[11px] text-muted-foreground">رقم الطلب</div>
          <div className="font-mono text-xs">{order.order_number}</div>
        </div>
      </div>

      {order.customer_phone && (
        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="text-sm">
            <span className="text-xs text-muted-foreground block mb-0.5">رقم العميل</span>
            <span dir="ltr" className="font-mono">{order.customer_phone}</span>
          </div>
          <div className="flex gap-2">
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
              >
                <MessageCircle className="w-4 h-4" />
                دردشة
              </a>
            )}
            {telHref && (
              <a
                href={telHref}
                className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted"
              >
                <Phone className="w-4 h-4" />
                اتصال
              </a>
            )}
          </div>
        </div>
      )}

      <div className="mt-3">
        <div className="text-xs text-muted-foreground mb-1">الطلب</div>
        <ul className="space-y-1.5">
          {order.order_items.map((it) => (
            <li key={it.id} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{it.product_name}</span>
                <span className="text-muted-foreground text-xs">× {it.quantity}</span>
              </div>
              {(it.size || it.finish || it.engraving || it.custom_width_cm || it.custom_length_cm) && (
                <div className="text-[12px] text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                  {it.size && <span>المقاس: {it.size}</span>}
                  {it.finish && <span>التشطيب: {it.finish}</span>}
                  {it.custom_width_cm && it.custom_length_cm && (
                    <span>
                      مقاس مخصص: {it.custom_width_cm}×{it.custom_length_cm} سم
                    </span>
                  )}
                  {it.engraving && <span>نقش: {it.engraving}</span>}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {order.shipping_notes && order.shipping_notes.trim() !== "" && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="text-[11px] font-semibold text-amber-800 mb-1">ملاحظات</div>
          <div className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">
            {order.shipping_notes}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">تاريخ الطلب: </span>
          {dateText}
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${urgencyClass}`}
          title="عدد الأيام منذ الطلب"
        >
          {daysLabel}
          {daysSince >= 7 && <span className="font-bold">· عاجل</span>}
        </span>
      </div>

      <div className="mt-4">
        {order.status === "confirmed" && (
          <button
            disabled={busy}
            onClick={() => onAdvance("in_production")}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Hammer className="w-5 h-5" />}
            ابدأ العمل
          </button>
        )}
        {order.status === "in_production" && (
          <button
            disabled={busy}
            onClick={() => onAdvance("delivered")}
            className="w-full h-12 rounded-xl bg-emerald-600 text-white font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            تم الانتهاء
          </button>
        )}
        {order.status === "delivered" && (
          <div className="w-full h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            تم الانتهاء
          </div>
        )}
      </div>
    </article>
  );
}

export const CARPENTER_NAMES: Record<CarpenterId, string> = {
  1: "النجار الأول",
  2: "النجار الثاني",
  3: "النجار الثالث",
};