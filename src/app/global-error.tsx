"use client";

// =============================================================================
// NaKmetiji.si — Global Error Boundary
// Catches errors in the root layout itself (rare but catastrophic).
// Must include its own <html> and <body> tags.
// =============================================================================

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { feature: "global_error_boundary" },
    });
  }, [error]);

  return (
    <html lang="sl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Napaka — NaKmetiji</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #F4F1EA;
            color: #1a3a2a;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 2rem;
          }
          .card {
            text-align: center;
            max-width: 420px;
            width: 100%;
          }
          .icon {
            font-size: 4rem;
            margin-bottom: 1.5rem;
          }
          h1 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
          }
          p {
            color: #9a7b5b;
            line-height: 1.6;
            margin-bottom: 1.5rem;
          }
          .code {
            font-family: monospace;
            font-size: 0.75rem;
            background: #ede5da;
            border-radius: 8px;
            padding: 0.5rem 1rem;
            display: inline-block;
            margin-bottom: 1.5rem;
            color: #7b5b43;
          }
          .actions {
            display: flex;
            gap: 0.75rem;
            justify-content: center;
            flex-wrap: wrap;
          }
          button, a {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            font-weight: 700;
            font-size: 0.875rem;
            cursor: pointer;
            text-decoration: none;
            border: none;
          }
          .btn-primary {
            background: #2D5A27;
            color: white;
          }
          .btn-secondary {
            background: #ede5da;
            color: #1a3a2a;
          }
          .support {
            margin-top: 2rem;
            font-size: 0.75rem;
            color: #b49a7c;
          }
          .support a {
            color: #2d8a56;
            background: none;
            padding: 0;
            font-weight: normal;
            text-decoration: underline;
            border-radius: 0;
          }
        `}</style>
      </head>
      <body>
        <div className="card">
          <div className="icon">🌾</div>
          <h1>Kritična napaka</h1>
          <p>
            Prišlo je do resne napake v aplikaciji. Naša ekipa je bila
            samodejno obveščena. Prosimo, osvežite stran.
          </p>

          {error.digest && (
            <div className="code">Koda: {error.digest}</div>
          )}

          <div className="actions">
            <button className="btn-primary" onClick={reset}>
              ↩ Osveži
            </button>
            <a className="btn-secondary" href="/">
              🏠 Domov
            </a>
          </div>

          <p className="support">
            Pomoč:{" "}
            <a href="mailto:podpora@nakmetiji.si">podpora@nakmetiji.si</a>
          </p>
        </div>
      </body>
    </html>
  );
}
