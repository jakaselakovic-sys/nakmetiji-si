"use client";

// =============================================================================
// Admin UI for triggering Kronika preview + send. Thin client — all auth
// and audit-log happens in the server action.
// =============================================================================

import { useState, useTransition } from "react";
import { Loader2, Send, Eye, CheckCircle, AlertTriangle } from "lucide-react";
import { runKronika } from "@/lib/kronika/action";

type Result = Awaited<ReturnType<typeof runKronika>>;

export function KronikaAdminClient({ csrf }: { csrf: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [isPending, startTransition] = useTransition();

  const trigger = (dryRun: boolean) =>
    startTransition(async () => {
      const r = await runKronika({ dryRun, _csrf: csrf });
      setResult(r);
    });

  const ok = result?.ok === true;
  const err = result?.ok === false ? result.message : null;
  const data = result?.ok === true ? result.data : null;

  return (
    <div className="rounded-3xl bg-white border border-earth-200 p-6 space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => trigger(true)}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-paper hover:bg-earth-50 text-forest-800 font-semibold px-5 py-3 text-sm border border-earth-200 disabled:opacity-50 transition-all"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
          Predogled (dry-run)
        </button>
        <button
          onClick={() => {
            if (!confirm("Pošljem Kroniko vsem potrjenim naročnikom? Zapis bo trajen.")) return;
            trigger(false);
          }}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-forest-700 hover:bg-forest-600 disabled:opacity-50 text-white font-bold px-5 py-3 text-sm shadow-md transition-all"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Generiraj in pošlji
        </button>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <strong>Napaka:</strong> {err}
          </div>
        </div>
      )}

      {ok && data && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-forest-200 bg-forest-50/60 p-4 text-sm text-forest-900 flex items-start gap-2">
            <CheckCircle size={16} className="mt-0.5 flex-shrink-0 text-forest-700" />
            <div>
              <strong>
                {data.subscribers_sent > 0
                  ? `Poslano ${data.subscribers_sent}/${data.subscribers_total}`
                  : "Dry-run uspešen"}
              </strong>{" "}
              · izdaja #{data.issue_number} · slug <code>{data.slug}</code>
              {!data.resend_enabled && (
                <p className="text-xs text-amber-700 mt-1">
                  ⚠ RESEND_API_KEY ni nastavljen — sporočilo ni bilo dejansko odposlano.
                </p>
              )}
              {data.subscribers_failed > 0 && (
                <p className="text-xs text-red-700 mt-1">
                  ⚠ Neuspelo: {data.subscribers_failed} — glej Sentry.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-earth-200 bg-paper p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-earth-500 mb-2">
              Predogled markdown-a
            </p>
            <pre className="text-xs text-earth-800 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
              {data.draft.body_md}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
