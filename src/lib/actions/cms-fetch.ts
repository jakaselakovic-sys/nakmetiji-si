"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { storySchema, type StoryInput } from "@/lib/schemas/cms";

export { storySchema, type StoryInput };

/**
 * Upsert content (Zgodba) into the DB securely.
 */
export async function upsertStory(id: string | null, data: StoryInput) {
  const supabase = await createSupabaseServer();

  // Validate the input rigorously
  const parsed = storySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.format() };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const payload = {
    ...parsed.data,
    author_id: user.id,
    published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const query = supabase.from("zgodbe");
  let result;

  if (id) {
    result = await query.update(payload).eq("id", id).select().single();
  } else {
    result = await query.insert(payload).select().single();
  }

  if (result.error) {
    Sentry.captureException(result.error, { tags: { action: "upsertStory" } });
    return { success: false, error: "Napaka pri shranjevanju baze." };
  }

  // Clear caches so the new blog appears immediately
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/novice");

  return { success: true, data: result.data };
}

/**
 * Smart Linking logic: Fetch related posts based on geography or farm match
 */
export async function fetchRelatedPosts(farm_id?: string, category?: string) {
  const supabase = await createSupabaseServer();
  
  let query = supabase
    .from("zgodbe")
    .select("id, slug, title, excerpt, category, metadata")
    .eq("status", "published")
    .limit(3);

  if (farm_id) {
    // Exact farm match always wins priority
    query = query.eq("related_farm_id", farm_id);
  } else if (category) {
    // Fallback to category
    query = query.eq("category", category);
  }

  const { data } = await query;
  return data ?? [];
}
