// Meta Pixel helper. The base pixel is loaded in src/routes/__root.tsx.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function track(event: string, params: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  try {
    window.fbq("track", event, params);
  } catch {
    // no-op — analytics must never break the app
  }
}

export function trackViewContent(productName: string, price: number) {
  track("ViewContent", {
    content_name: productName,
    value: Number(price) || 0,
    currency: "EGP",
  });
}

export function trackInitiateCheckout(productName: string, price: number) {
  track("InitiateCheckout", {
    content_name: productName,
    value: Number(price) || 0,
    currency: "EGP",
  });
}

export function trackPurchase(orderValue: number, orderId: string) {
  track("Purchase", {
    value: Number(orderValue) || 0,
    currency: "EGP",
    order_id: orderId,
  });
}

export function trackLead(source: string, productName: string) {
  track("Lead", {
    content_name: productName,
    lead_source: source,
  });
}

export function trackAddToCart(productName: string, price: number) {
  track("AddToCart", {
    content_name: productName,
    value: Number(price) || 0,
    currency: "EGP",
  });
}

export function trackContact() {
  track("Contact", {});
}