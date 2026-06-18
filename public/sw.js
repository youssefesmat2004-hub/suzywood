// Suzy Wood admin push notification service worker.
// This SW is intentionally minimal: no app-shell caching, just push handling.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Suzy Wood", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Suzy Wood";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-512.png",
    badge: "/icons/icon-512.png",
    tag: data.tag || "suzywood",
    renotify: true,
    requireInteraction: false,
    data: { url: data.url || "/admin" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/admin";
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of allClients) {
      try {
        const url = new URL(client.url);
        if (url.origin === self.location.origin) {
          await client.focus();
          if ("navigate" in client) {
            await client.navigate(target);
          }
          return;
        }
      } catch (e) {}
    }
    await self.clients.openWindow(target);
  })());
});