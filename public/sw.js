// =============================================================================
// NaKmetiji.si — Service Worker
// PWA shell + offline stamp sync via Background Sync API
// =============================================================================

const CACHE_NAME = "nakmetiji-v2";
const PRECACHE_URLS = [
  "/dashboard",
  "/manifest.json",
];

// ─── Install — precache shell ───────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate — clean old caches ────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch — network-first, fallback to cache ──────────────────────────────

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api") || url.hostname.includes("supabase")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ─── Background Sync — offline stamp queue ──────────────────────────────────
//
// When the user claims a stamp while offline, the client stores it in IndexedDB
// and registers a sync tag "stamp-sync". When connectivity returns, this handler
// reads the IndexedDB queue and POSTs each pending stamp to the API.

self.addEventListener("sync", (event) => {
  if (event.tag === "stamp-sync") {
    event.waitUntil(syncOfflineStamps());
  }
});

// Also sync on basic online detection (for browsers without Background Sync)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SYNC_STAMPS") {
    syncOfflineStamps().catch((err) => console.error("[SW] sync failed:", err));
  }
});

async function syncOfflineStamps() {
  // Open IndexedDB (idb-keyval uses "keyval-store" / "keyval" by default)
  const db = await openIDB();
  const queue = await getFromIDB(db, "nakmetiji_offline_stamps");
  if (!queue || !Array.isArray(queue) || queue.length === 0) return;

  const synced = [];

  const now = Date.now();
  for (const item of queue) {
    // Drop tickets older than 5 min — server will reject them anyway
    if (!item.ts || now - item.ts > 5 * 60 * 1000) {
      synced.push(item.id);
      continue;
    }
    try {
      const res = await fetch("/api/green-stamp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farm: item.farmSlug,
          lat: item.lat,
          lng: item.lng,
          accuracy: item.accuracy,
          ts: item.ts,
          sig: item.sig,
        }),
      });

      if (res.ok || res.status === 409) {
        // Success or duplicate — remove from queue
        synced.push(item.id);
      }
    } catch {
      // Network still down — stop trying, Background Sync will retry
      break;
    }
  }

  if (synced.length > 0) {
    const remaining = queue.filter((q) => !synced.includes(q.id));
    await putToIDB(db, "nakmetiji_offline_stamps", remaining);

    // Notify all clients that sync completed
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: "STAMPS_SYNCED", count: synced.length });
    });
  }
}

// ─── Minimal IndexedDB helpers (no external deps in SW) ─────────────────────

function openIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("keyval-store", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("keyval");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getFromIDB(db, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("keyval", "readonly");
    const store = tx.objectStore("keyval");
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function putToIDB(db, key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("keyval", "readwrite");
    const store = tx.objectStore("keyval");
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
