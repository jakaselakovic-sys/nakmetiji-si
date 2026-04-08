// =============================================================================
// NaKmetiji.si — Types Barrel Export
// =============================================================================

// Novi tipi (Supabase shema)
export * from "./database";

// Stari tipi (backward compat za obstoječe komponente)
export { Region, REGION_LABELS, EXPERIENCE_LABELS } from "./farm";
export type { ExperienceTag, Farm, FarmContact, GeoLocation } from "./farm";
