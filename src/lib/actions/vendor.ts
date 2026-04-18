"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

// Zod schema for translations
const translationsSchema = z.object({
  sl: z.string().min(10).max(3000),
  en: z.string().min(10).max(3000),
  de: z.string().min(10).max(3000),
  it: z.string().min(10).max(3000),
});

export async function saveFarmTranslations(kmetijaId: string, prevodi: Record<string, string>) {
  if (!kmetijaId) return { error: "Manjka ID kmetije." };

  // 1. Zod Validation
  const parsed = translationsSchema.safeParse(prevodi);
  if (!parsed.success) {
    Sentry.captureMessage("Zod Validation Failed", { level: "warning", extra: { errors: parsed.error.issues } });
    return { error: "Vsebina prevodov vsebuje nedovoljene znake ali neveljavno dolžino." };
  }

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Niste prijavljeni." };

  // 2. Atomic Backup: Fetch previous translations
  const { data: currentFarm, error: fetchError } = await supabase
    .from("kmetije")
    .select("prevodi")
    .eq("id", kmetijaId)
    .single();

  if (fetchError) {
    return { error: "Napaka pri preverjanju obstoječega profila." };
  }

  const currentPrevodi = currentFarm?.prevodi ?? {};

  // 3. Update with backup preserving
  const { error } = await supabase
    .from("kmetije")
    .update({ 
      prevodi: parsed.data,
      prevodi_backup: currentPrevodi 
    })
    .eq("id", kmetijaId);

  if (error) {
    Sentry.captureException(error, { tags: { action: "saveFarmTranslations" } });
    return { error: "Ni bilo mogoče shraniti prevodov v bazo." };
  }

  // Izpraznimo predpomnilnik
  revalidatePath("/dashboard");
  revalidatePath(`/kmetije/[slug]`, "page");

  return { success: true };
}
