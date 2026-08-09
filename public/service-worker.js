const SHELL_CACHE = "arcana-tcg-shell-v1.7.2";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/pwa-icon.svg",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
];

async function putIfSuccessful(cache, request, response) {
  if (response?.ok) await cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    return await putIfSuccessful(cache, request, await fetch(request));
  } catch {
    return (await cache.match(request)) || (fallbackUrl ? cache.match(fallbackUrl) : Response.error());
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith("arcana-tcg-") && name !== SHELL_CACHE)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode !== "navigate" || (url.pathname !== "/" && url.pathname !== "/index.html")) return;
  event.respondWith(networkFirst(request, "/index.html"));
});
