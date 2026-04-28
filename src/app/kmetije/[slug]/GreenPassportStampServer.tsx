import { createSupabaseServer } from "@/lib/supabase/server";

export async function GreenPassportStampServer({ kmetijaId }: { kmetijaId: string }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  let isAlreadyStamped = false;
  if (user) {
    const { data: stamp } = await supabase
      .from("green_stamps")
      .select("id")
      .eq("gost_id", user.id)
      .eq("kmetija_id", kmetijaId)
      .maybeSingle();
    isAlreadyStamped = !!stamp;
  }

  return (
    <div className="rounded-2xl bg-white border border-emerald-200/70 shadow-sm p-5">
      <h4 className="text-sm font-bold text-forest-900 mb-1 flex items-center gap-2">
        🌿 Zeleni Potni List
      </h4>
      {isAlreadyStamped ? (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 mt-2">
          <span className="text-lg">✅</span>
          <div>
            <p className="font-bold text-sm">Žig zbran!</p>
            <p className="text-xs text-emerald-600">Ta kmetija je v tvojem potnem listu.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
            <span className="text-2xl mt-0.5">📱</span>
            <div>
              <p className="text-xs font-bold text-forest-800 mb-0.5">Skeniraj QR kodo na kmetiji</p>
              <p className="text-[11px] text-earth-500 leading-relaxed">
                Žig lahko pridobite le fizično na lokaciji kmetije — poiščite QR kodo pri gostitelju in jo skenirajte s telefonom.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
