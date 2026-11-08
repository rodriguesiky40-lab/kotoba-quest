const CACHE_NAME = "kotoba-quest-shell-v3";
const APP_SHELL = [
  "/", "/manifest.webmanifest", "/icon.svg",
  "/assets/aiko/aiko_portrait_transparent.webp", "/assets/aiko/aiko_full_body_transparent.webp",
  "/assets/aiko/aiko_expressions_sheet.webp",
  "/assets/world/japan_learning_world_map.webp",
  "/assets/scenarios/japanese_classroom.webp",
  "/assets/scenarios/kyoto_traditional_street.webp",
  "/assets/scenarios/tokyo_city_street.webp",
  "/assets/scenarios/japanese_shop.webp",
  "/assets/tutors/emily/1000137141.png", "/assets/tutors/emily/1000137142.png", "/assets/tutors/emily/1000137144.png",
  "/assets/tutors/emily/Duck-ai-image-2026-11-08-02-35.jpeg",
  "/assets/tutors/hana/1000137160.png", "/assets/tutors/sofia/1000137159.png", "/assets/tutors/chloe/1000137158.png",
  "/assets/rewards/coin.webp", "/assets/rewards/heart.webp", "/assets/rewards/trophy.webp",
  "/assets/rewards/medals_set.webp", "/assets/rewards/treasure_chest.webp", "/assets/rewards/xp_badge.webp"
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
