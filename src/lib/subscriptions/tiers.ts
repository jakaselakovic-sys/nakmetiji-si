import type { KmetijaPaket } from "@/types/database";
import { PAKET_CONFIG, VIDEO_OSNOVNA_CENA } from "@/types/database";

export const PAID_TIERS = ["avtenticnost", "posesek", "titan_elite"] as const satisfies readonly KmetijaPaket[];
export const PREMIUM_TOOL_TIERS = ["posesek", "titan_elite"] as const satisfies readonly KmetijaPaket[];
export const VIDEO_PREVIEW_TIERS = ["titan_elite"] as const satisfies readonly KmetijaPaket[];

export function isKmetijaPaket(value: unknown): value is KmetijaPaket {
  return (
    value === "korenine" ||
    value === "avtenticnost" ||
    value === "posesek" ||
    value === "titan_elite"
  );
}

export function canUseVendorAiTools(tier: unknown): tier is (typeof PREMIUM_TOOL_TIERS)[number] {
  return isKmetijaPaket(tier) && PREMIUM_TOOL_TIERS.includes(tier as (typeof PREMIUM_TOOL_TIERS)[number]);
}

export function getTierRank(tier: unknown): number {
  return isKmetijaPaket(tier) ? PAKET_CONFIG[tier].tier_rang : 0;
}

export function getVideoDiscount(tier: unknown): number {
  return isKmetijaPaket(tier) ? PAKET_CONFIG[tier].video_popust : 0;
}

export function getVideoPrice(tier: unknown): number {
  return Math.round(VIDEO_OSNOVNA_CENA * (1 - getVideoDiscount(tier)));
}

export function canShowVideoPreview(tier: unknown): tier is (typeof VIDEO_PREVIEW_TIERS)[number] {
  return isKmetijaPaket(tier) && VIDEO_PREVIEW_TIERS.includes(tier as (typeof VIDEO_PREVIEW_TIERS)[number]);
}

export function canReceiveJozeBoost(tier: unknown): boolean {
  return getTierRank(tier) > 0;
}

export function canUsePrioritySearch(tier: unknown): boolean {
  return getTierRank(tier) >= 2;
}
