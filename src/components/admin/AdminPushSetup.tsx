import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getWebPushPublicKey, savePushSubscription } from "@/lib/web-push.functions";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function urlBase64ToUint8Array(b64: string): Uint8Array {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
function abToB64Url(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function isSupported() {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window;
}

function isInLovablePreview() {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h.startsWith("id-preview--")
    || h.startsWith("preview--")
    || h.endsWith(".lovableproject.com")
    || h === "lovableproject.com"
    || window.self !== window.top;
}

export function AdminPushSetup() {
  const fetchPublicKey = useServerFn(getWebPushPublicKey);
  const saveSub = useServerFn(savePushSubscription);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!isSupported()) { setPermission("unsupported"); return; }
    if (isInLovablePreview()) return; // never register SW inside preview iframe
    setPermission(Notification.permission);
    (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        setSubscribed(!!existing);
        const dismissed = localStorage.getItem("sw-push-prompt-dismissed") === "1";
        if (!existing && Notification.permission === "default" && !dismissed) {
          setShowPrompt(true);
        }
      } catch (e) {
        console.error("SW register failed", e);
      }
    })();
  }, []);

  const subscribe = async () => {
    if (!isSupported()) return;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast.error("Notifications blocked", { description: "Enable them from your browser settings to receive alerts." });
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await fetchPublicKey();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const endpoint = sub.endpoint || json.endpoint || "";
      const p256dh = json.keys?.p256dh || abToB64Url(sub.getKey("p256dh"));
      const auth = json.keys?.auth || abToB64Url(sub.getKey("auth"));
      const res = await saveSub({ data: {
        endpoint, p256dh, auth,
        user_agent: navigator.userAgent.slice(0, 500),
      } });
      if (!res?.ok) {
        toast.error("Couldn't enable notifications", { description: (res as { error?: string })?.error ?? "Please try again." });
        return;
      }
      setSubscribed(true);
      setShowPrompt(false);
      toast.success("Notifications enabled", { description: "You'll be alerted on this device for new orders and bookings." });
    } catch (e) {
      console.error("Push subscribe failed", e);
      toast.error("Notifications setup failed", { description: String((e as Error)?.message ?? e) });
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem("sw-push-prompt-dismissed", "1");
    setShowPrompt(false);
  };

  if (permission === "unsupported" || isInLovablePreview()) return null;
  if (!showPrompt && (subscribed || permission === "denied")) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-border bg-card shadow-lg p-4 flex gap-3 items-start">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        {permission === "denied" ? <BellOff className="h-5 w-5 text-primary" /> : <Bell className="h-5 w-5 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">Get phone alerts</div>
        <p className="text-xs text-muted-foreground mt-1">
          Enable push notifications to receive a phone alert whenever a new order, booking, or custom request comes in.
        </p>
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={subscribe} disabled={busy}>
            {busy ? "Setting up…" : "Enable notifications"}
          </Button>
          <Button size="sm" variant="ghost" onClick={dismiss} disabled={busy}>Not now</Button>
        </div>
      </div>
    </div>
  );
}