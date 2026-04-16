"use client";

// Registers the PWA service worker after the page has loaded.
// Lives in a Client Component so Next.js treats it as browser-only code
// and avoids the "script tag while rendering" warning from the App Router.

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
