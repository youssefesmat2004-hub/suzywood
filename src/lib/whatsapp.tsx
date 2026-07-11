import { MessageCircle } from "lucide-react";

/**
 * Normalize an Egyptian phone number to WhatsApp E.164 (no +).
 * "01096313532" -> "201096313532". Returns "" when invalid.
 */
export function toWaNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  let digits = String(phone).replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = "20" + digits.slice(1);
  if (digits.length < 10) return "";
  return digits;
}

export function waLink(phone: string | null | undefined, message?: string): string | null {
  const num = toWaNumber(phone);
  if (!num) return null;
  const q = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${num}${q}`;
}

export function firstName(fullName: string | null | undefined): string {
  if (!fullName) return "there";
  return String(fullName).trim().split(/\s+/)[0] || "there";
}

type Props = {
  phone: string | null | undefined;
  message?: string;
  className?: string;
  label?: string;
};

export function WhatsAppLink({ phone, message, className, label }: Props) {
  const href = waLink(phone, message);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label={label ?? "Chat on WhatsApp"}
      title={label ?? "Chat on WhatsApp"}
      className={
        className ??
        "inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
      }
    >
      <MessageCircle className="h-3.5 w-3.5" />
    </a>
  );
}