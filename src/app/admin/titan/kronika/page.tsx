// =============================================================================
// NaKmetiji.si — Admin · Kronika
// Server Component — shows past issues + a form that either previews a dry-run
// draft or actually generates & sends this week's Kronika.
// =============================================================================

import { createSupabaseServer } from "@/lib/supabase/server";
import { issueCsrfToken } from "@/lib/titan/action";
import { KronikaAdminClient } from "@/components/admin/titan/KronikaAdminClient";

interface IssueRow {
  id: string;
  issue_number: number;
  slug: string;
  title: string;
  published_at: string;
  sent_count: number;
  new_farm_ids: string[];
}

export default async function KronikaAdminPage() {
  const sb = await createSupabaseServer();
  const [issuesRes, csrf] = await Promise.all([
    sb
      .from("kronika_entries")
      .select("id, issue_number, slug, title, published_at, sent_count, new_farm_ids")
      .order("published_at", { ascending: false })
      .limit(12),
    issueCsrfToken(),
  ]);

  const issues = (issuesRes.data as IssueRow[] | null) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-600/70 mb-2">
          Titan · Kronika
        </p>
        <h1 className="font-display font-black text-3xl text-forest-900 tracking-tight">
          Jožetova Kronika
        </h1>
        <p className="text-earth-600 mt-2 text-sm">
          Tedensko sporočilo naročnikom. Najprej predogled (dry-run), potem pravo
          pošiljanje. Po pošiljanju se vpis trajno zapiše v <code>kronika_entries</code>.
        </p>
      </div>

      <KronikaAdminClient csrf={csrf} />

      <div>
        <h2 className="font-display font-bold text-xl text-forest-900 mb-3">Pretekle izdaje</h2>
        {issues.length === 0 ? (
          <p className="text-sm text-earth-500 italic">Ni še nobene izdaje.</p>
        ) : (
          <div className="rounded-2xl border border-earth-200 overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-earth-50 text-earth-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Naslov</th>
                  <th className="px-4 py-3 text-left">Objavljeno</th>
                  <th className="px-4 py-3 text-left">Poslano</th>
                  <th className="px-4 py-3 text-left">Nove kmetije</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((i) => (
                  <tr key={i.id} className="border-t border-earth-100">
                    <td className="px-4 py-3 font-mono text-earth-500">{i.issue_number}</td>
                    <td className="px-4 py-3 font-semibold text-forest-900">{i.title}</td>
                    <td className="px-4 py-3 text-earth-600">
                      {new Date(i.published_at).toLocaleDateString("sl-SI")}
                    </td>
                    <td className="px-4 py-3 text-earth-600">{i.sent_count}</td>
                    <td className="px-4 py-3 text-earth-600">{i.new_farm_ids.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
