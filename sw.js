self.addEventListener("install", e => {
  e.waitUntil(onInstall(e));
});

const CACHE = "cache--v1";
const MAP_CACHE = "map-cache--v1";

async function onInstall() {
  self.skipWaiting();

  const cache = await caches.open(CACHE);

  return cache.addAll([
    "/",
    "https://unpkg.com/leaflet@1.3.1/dist/leaflet.css",
    "https://unpkg.com/leaflet@1.3.1/dist/leaflet.js",
  ]);
}

self.addEventListener("activate", e => e.waitUntil(clients.claim()));

self.addEventListener("fetch", e => e.respondWith(onFetch(e)));

async function onFetch(e) {
  try {
    const { request } = e;
    const url = new URL(request.url);

    if (url.host === "api.tiles.mapbox.com") {
      const cache = await caches.open(MAP_CACHE);
      const matching = await cache.match(request);
      if (matching) {
        return matching;
      } else {
        const response = await fetch(request);
        e.waitUntil(cache.put(request, response.clone()));
        return response;
      }
    } else {
      return fetch(request);
    }
  } catch (e) {
    // HACK: respond with promise that never resolves to trick Leaflet
    // into showing the pixelated version of the old image.
    // Introduces memory leak! Don't use this in real life!
    return new Promise(() => {});
  }
}
