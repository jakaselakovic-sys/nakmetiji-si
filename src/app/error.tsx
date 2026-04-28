"use client";

// =============================================================================
// NaKmetiji.si — Route Error Boundary
// Prikazano ob napaki v katerikoli strani aplikacije.
// Logs to console; extend with Sentry.captureException() when DSN is set.
// =============================================================================

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log removed, we rely on Sentry below

    // Report to Sentry
    Sentry.captureException(error);

    // Report to Better Stack logs if configured
    const logsUrl = process.env.NEXT_PUBLIC_BETTER_STACK_LOGS_URL;
    if (logsUrl) {
      fetch(logsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "error",
          message: error.message,
          digest: error.digest,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Friendly illustration */}
        <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-earth-100 flex items-center justify-center text-5xl">
          🌾
        </div>

        <h1 className="text-2xl font-bold text-forest-900 mb-3">
          Ups, nekaj je šlo narobe
        </h1>
        <p className="text-earth-600 mb-6 leading-relaxed">
          Prišlo je do nepričakovane napake. Naša ekipa je bila obveščena.
          Prosimo, poskusite znova ali nas kontaktirajte.
        </p>

        {/* Error reference for support */}
        {error.digest && (
          <p className="text-xs text-earth-400 mb-6 font-mono bg-earth-50 rounded-lg px-3 py-2 inline-block">
            Koda napake: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 px-6 py-3 text-sm font-bold text-white hover:bg-forest-600 transition-colors"
          >
            ↩ Poskusi znova
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-earth-100 px-6 py-3 text-sm font-bold text-forest-800 hover:bg-earth-200 transition-colors"
          >
            🏠 Na začetek
          </Link>
        </div>

        {/* Support contact */}
        <p className="mt-8 text-xs text-earth-500">
          Potrebujete pomoč?{" "}
          <a
            href="mailto:podpora@nakmetiji.si"
            className="text-forest-600 hover:text-forest-800 underline underline-offset-2"
          >
            podpora@nakmetiji.si
          </a>
        </p>
      </div>
    </div>
  );
}
