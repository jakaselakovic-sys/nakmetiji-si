// =============================================================================
// NaKmetiji.si — Slovenian plural helper
// Slovenian has dual (2) and tetra-plural (3-4) forms; "5+" goes back to
// genitive plural. The Intl.PluralRules with "sl" locale exposes this:
//
//   1   → "one"   (dan)
//   2   → "two"   (dneva)
//   3-4 → "few"   (dnevi)
//   5+  → "other" (dni)
//
// `pluralSl(count, { one, two, few, other })` gives you the right form.
// `pluralPair(count, label)` is shorthand for "{count} {form}" with a
// curated dictionary of nouns we use across the app.
// =============================================================================

const RULES = new Intl.PluralRules("sl");

export type SlForms = { one: string; two: string; few: string; other: string };

/** Return the correct form of a noun for the given count. */
export function pluralSl(count: number, forms: SlForms): string {
  const r = RULES.select(count);
  switch (r) {
    case "one":   return forms.one;
    case "two":   return forms.two;
    case "few":   return forms.few;
    default:      return forms.other;
  }
}

/** Format "{count} {form}" for a known noun. Add new entries as needed. */
export function pluralPair(count: number, key: PluralKey): string {
  return `${count} ${pluralSl(count, DICTIONARY[key])}`;
}

export type PluralKey =
  | "dan"
  | "noc"
  | "postanek"
  | "kmetija"
  | "regija"
  | "oseba"
  | "ura"
  | "minuta"
  | "kilometer"
  | "zig";

const DICTIONARY: Record<PluralKey, SlForms> = {
  dan:        { one: "dan",       two: "dneva",     few: "dnevi",     other: "dni" },
  noc:        { one: "noč",       two: "noči",      few: "noči",      other: "noči" },
  postanek:   { one: "postanek",  two: "postanka",  few: "postanki",  other: "postankov" },
  kmetija:    { one: "kmetija",   two: "kmetiji",   few: "kmetije",   other: "kmetij" },
  regija:     { one: "regija",    two: "regiji",    few: "regije",    other: "regij" },
  oseba:      { one: "oseba",     two: "osebi",     few: "osebe",     other: "oseb" },
  ura:        { one: "ura",       two: "uri",       few: "ure",       other: "ur" },
  minuta:     { one: "minuta",    two: "minuti",    few: "minute",    other: "minut" },
  kilometer:  { one: "kilometer", two: "kilometra", few: "kilometri", other: "kilometrov" },
  zig:        { one: "žig",       two: "žiga",      few: "žigi",      other: "žigov" },
};
