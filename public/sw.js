const CACHE_NAME = "kotoba-quest-shell-v2";
const APP_SHELL = [
  "/", "/manifest.webmanifest", "/icon.svg",
  "/assets/aiko/aiko_portrait_transparent.webp", "/assets/aiko/aiko_full_body_transparent.webp",
  "/assets/aiko/aiko_expressions_sheet.webp",
  "/assets/world/japan_learning_world_map.webp",
  "/assets/scenarios/japanese_classroom.webp",
  "/assets/scenarios/kyoto_traditional_street.webp",
  "/assets/scenarios/tokyo_city_street.webp",
  "/assets/scenarios/japanese_shop.webp"
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => undefined)));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)); }
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || caches.match("/"))));
});
