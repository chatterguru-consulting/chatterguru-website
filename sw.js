/*
 * Chatterguru app service worker: makes the site installable and quick on a phone
 * while keeping its storage and download small.
 *
 * - Site pages: network first, so visitors always get the current page; the last copy
 *   (and an offline page) answers when there is no connection.
 * - The pinned Cesium build: cached on first use and kept, so a second 3D scene does not
 *   download it again. Its folder name carries the version, so it never changes.
 * - Site styles, scripts, icons and the shared phone layout: served from the cache and
 *   refreshed in the background.
 * - Never cached: the 3D scene pages and their data (megabytes each), map tiles from
 *   USGS and anything else from another site. Those go straight to the network.
 */
const VERSION = 'cg-app-2026-11-20b';
const PAGES = VERSION + ':pages';
const STATIC = VERSION + ':static';
const CESIUM = 'cg-cesium-1.119.0';
const OFFLINE = '/offline.html';
const PRECACHE = [OFFLINE, '/assets/icons/icon-192.png', '/manifest.webmanifest'];
const MAX_PAGES = 30;
const MAX_STATIC = 60;
const MAX_CESIUM = 400;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  const keep = new Set([PAGES, STATIC, CESIUM]);
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

function isScene(path) {
  return path.startsWith('/demos/s3/studio/') || path.startsWith('/demos/s3/aesa/')
    || path.startsWith('/demos/s3/recorded-crossing/');
}

// Cache writes finish under event.waitUntil, so a phone cannot stop the worker mid-write.
function store(event, name, key, response, max) {
  const copy = response.clone();
  event.waitUntil(caches.open(name).then((c) => c.put(key, copy)).then(() => trim(name, max)).catch(() => {}));
}

async function page(event) {
  const request = event.request;
  const url = new URL(request.url);
  try {
    const response = await fetch(request);
    if (response.ok && !isScene(url.pathname)) store(event, PAGES, url.pathname, response, MAX_PAGES);
    return response;
  } catch (err) {
    const cached = await caches.match(url.pathname, { cacheName: PAGES });
    return cached || (await caches.match(OFFLINE)) || Response.error();
  }
}

async function cacheFirst(event, name, max) {
  const cached = await caches.match(event.request, { cacheName: name });
  if (cached) return cached;
  const response = await fetch(event.request);
  if (response.ok) store(event, name, event.request, response, max);
  return response;
}

async function staleWhileRevalidate(event) {
  const cached = await caches.match(event.request, { cacheName: STATIC });
  const fresh = fetch(event.request).then((response) => {
    if (response.ok) store(event, STATIC, event.request, response, MAX_STATIC);
    return response;
  }).catch(() => cached || Response.error());  // offline: the cached copy, no unhandled error
  if (cached) {
    event.waitUntil(fresh.catch(() => {}));
    return cached;
  }
  return fresh;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // map tiles and other sites: network only
  const path = url.pathname;
  if (request.mode === 'navigate') {
    event.respondWith(page(event));
  } else if (path.startsWith('/demos/s3/vendor/cesium-1.119.0/')) {
    event.respondWith(cacheFirst(event, CESIUM, MAX_CESIUM));
  } else if (path.startsWith('/assets/') || path.startsWith('/demos/s3/shared/')
             || path === '/favicon.ico' || path === '/manifest.webmanifest') {
    event.respondWith(staleWhileRevalidate(event));
  }
  // Everything else (scene pages' data, models, the recorded replay): network only.
});
