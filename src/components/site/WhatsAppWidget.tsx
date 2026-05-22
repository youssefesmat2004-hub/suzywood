import { useEffect, useState } from "react";
import { X } from "lucide-react";

const PHONE = "201096313532";
const MESSAGE = "Hi Suzy Wood! I need help choosing a product 🪵";
const HREF = `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`;

export function WhatsAppWidget() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("sw_wa_dismissed") === "1") return;
    const t = setTimeout(() => setShowPopup(true), 10000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setShowPopup(false);
    try { sessionStorage.setItem("sw_wa_dismissed", "1"); } catch {}
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {showPopup && (
        <div className="relative max-w-[260px] rounded-2xl bg-card border border-border shadow-elegant p-4 pr-9 text-sm animate-[sw-float_5s_ease-in-out_infinite]">
          <button
            aria-label="Dismiss"
            onClick={dismiss}
            className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <p className="font-serif text-base text-foreground">👋 Need help choosing?</p>
          <p className="text-xs text-muted-foreground mt-1">Chat with us on WhatsApp — we usually reply in minutes.</p>
        </div>
      )}
      <a
        href={HREF}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="pulse-green flex h-14 w-14 items-center justify-center rounded-full text-white shadow-elegant transition-transform hover:scale-110"
        style={{ backgroundColor: "oklch(0.62 0.18 145)" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.554-5.338 11.89-11.893 11.89a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
        </svg>
      </a>
    </div>
  );
}
