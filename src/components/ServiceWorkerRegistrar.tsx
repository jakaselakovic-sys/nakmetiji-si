"use client";

// =============================================================================
// ServiceWorkerRegistrar — PWA registration + offline stamp sync bridge
//
// 1. Registers /sw.js on mount
// 2. When online event fires, triggers stamp sync via SW message or Background Sync
// 3. Listens for STAMPS_SYNCED messages from SW to show user feedback
// =============================================================================

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    // Register SW
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        registration = reg;
      })
      .catch(() => {});

    // When connectivity returns, trigger stamp sync
    function handleOnline() {
      if (registration?.active) {
        // Try Background Sync API first (Chrome, Edge)
        if ("sync" in registration) {
          (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } })
            .sync.register("stamp-sync").catch(() => {
              // Fallback: send message directly
              registration?.active?.postMessage({ type: "SYNC_STAMPS" });
            });
        } else {
          // Safari/Firefox fallback
          registration.active.postMessage({ type: "SYNC_STAMPS" });
        }
      }
    }

    window.addEventListener("online", handleOnline);

    // Listen for sync completion from SW
    function handleSWMessage(event: MessageEvent) {
      if (event.data?.type === "STAMPS_SYNCED" && event.data.count > 0) {
        // Could dispatch a custom event or use a toast here
        console.info(`[SW] Sinhroniziranih ${event.data.count} žigov iz čakalnice.`);
      }
    }

    navigator.serviceWorker.addEventListener("message", handleSWMessage);

    // If already online, trigger sync on mount (catches queued items from previous sessions)
    if (navigator.onLine) {
      // Small delay to ensure SW is registered
      setTimeout(handleOnline, 2000);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      navigator.serviceWorker.removeEventListener("message", handleSWMessage);
    };
  }, []);

  return null;
}
