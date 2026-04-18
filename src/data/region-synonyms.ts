// =============================================================================
// NaKmetiji.si — Region Synonym Map
//
// Maps Slovenian place names, towns, and colloquial names to official DB region
// enums. Used by Oracle's deterministic region detector (runs <1ms pre-LLM).
//
// Extracted from oracle/route.ts for maintainability — update here, not in API.
// =============================================================================

import type { Regija } from "@/types/database";

export const REGION_SYNONYMS: Record<string, Regija> = {
  // ── Gorenjska ──
  gorenjska: "gorenjska",
  gorenjsko: "gorenjska",
  bled: "gorenjska",
  bohinj: "gorenjska",
  kranj: "gorenjska",
  "kranjska gora": "gorenjska",
  "škofja loka": "gorenjska",
  triglav: "gorenjska",
  pokljuka: "gorenjska",
  radovljica: "gorenjska",
  jesenice: "gorenjska",
  "julijske alpe": "gorenjska",
  "karavanke": "gorenjska",
  žirovnica: "gorenjska",
  tržič: "gorenjska",

  // ── Primorska ──
  primorska: "primorska",
  primorsko: "primorska",
  kras: "primorska",
  "kraška": "primorska",
  istra: "primorska",
  koper: "primorska",
  piran: "primorska",
  portorož: "primorska",
  sežana: "primorska",
  izola: "primorska",
  ankaran: "primorska",
  "slovenska istra": "primorska",

  // ── Goriška (maps to primorska in our DB) ──
  goriška: "primorska",
  "goriško": "primorska",
  "nova gorica": "primorska",
  "goriška brda": "primorska",
  brda: "primorska",
  vipava: "primorska",
  "vipavska dolina": "primorska",
  soča: "primorska",
  bovec: "primorska",
  tolmin: "primorska",
  kobarid: "primorska",
  "idrija": "primorska",
  "cerkno": "primorska",
  ajdovščina: "primorska",

  // ── Štajerska ──
  štajerska: "stajerska",
  štajersko: "stajerska",
  stajerska: "stajerska",
  maribor: "stajerska",
  ptuj: "stajerska",
  "slovenske gorice": "stajerska",
  "haloze": "stajerska",
  jeruzalem: "stajerska",
  ormož: "stajerska",
  "slovenska bistrica": "stajerska",
  "spodnja štajerska": "stajerska",
  "zgornja štajerska": "stajerska",
  lenart: "stajerska",
  pesnica: "stajerska",
  ruše: "stajerska",
  "dravska dolina": "stajerska",

  // ── Pomurska (Prekmurje) ──
  pomurska: "pomurska",
  pomursko: "pomurska",
  prekmurje: "pomurska",
  "prekmursko": "pomurska",
  goričko: "pomurska",
  ravensko: "pomurska",
  dolinsko: "pomurska",
  "murska sobota": "pomurska",
  lendava: "pomurska",
  "moravske toplice": "pomurska",
  "radenci": "pomurska",
  ljutomer: "pomurska",
  "gornja radgona": "pomurska",
  beltinci: "pomurska",
  "pomurje": "pomurska",
  mura: "pomurska",
  "terme 3000": "pomurska",

  // ── Dolenjska ──
  dolenjska: "dolenjska",
  dolenjsko: "dolenjska",
  "novo mesto": "dolenjska",
  "dolenjske toplice": "dolenjska",
  šmarješke: "dolenjska",
  "šmarješke toplice": "dolenjska",
  žužemberk: "dolenjska",
  trebnje: "dolenjska",
  mirna: "dolenjska",
  "suha krajina": "dolenjska",

  // ── Koroška ──
  koroška: "koroska",
  koroško: "koroska",
  koroska: "koroska",
  dravograd: "koroska",
  "ravne na koroškem": "koroska",
  prevalje: "koroska",
  "slovenj gradec": "koroska",
  "mežiška dolina": "koroska",
  "mislinjska dolina": "koroska",

  // ── Savinjska ──
  savinjska: "savinjska",
  savinjsko: "savinjska",
  celje: "savinjska",
  velenje: "savinjska",
  "rogaška slatina": "savinjska",
  "terme olimia": "savinjska",
  šentjur: "savinjska",
  laško: "savinjska",
  "žalec": "savinjska",
  "savinjska dolina": "savinjska",
  "logarska dolina": "savinjska",
  "kamniško-savinjske alpe": "savinjska",
  "mozirje": "savinjska",
  "zgornja savinjska": "savinjska",

  // ── Notranjska ──
  notranjska: "notranjska",
  notranjsko: "notranjska",
  postojna: "notranjska",
  "postojnska jama": "notranjska",
  cerknica: "notranjska",
  "cerkniško jezero": "notranjska",
  "snežnik": "notranjska",
  pivka: "notranjska",
  ilirska: "notranjska",
  "ilirska bistrica": "notranjska",
  "notranjski kras": "notranjska",

  // ── Zasavska ──
  zasavska: "zasavska",
  zasavsko: "zasavska",
  zasavje: "zasavska",
  trbovlje: "zasavska",
  hrastnik: "zasavska",
  zagorje: "zasavska",

  // ── Posavska ──
  posavska: "posavska",
  posavsko: "posavska",
  posavje: "posavska",
  krško: "posavska",
  brežice: "posavska",
  sevnica: "posavska",
  "terme čatež": "posavska",
  čatež: "posavska",
  "bizeljsko": "posavska",

  // ── Jugovzhodna Slovenija ──
  "jugovzhodna slovenija": "jugovzhodna_slovenija",
  "jugovzhodna": "jugovzhodna_slovenija",
  "jv slovenija": "jugovzhodna_slovenija",
  "bela krajina": "jugovzhodna_slovenija",
  "kočevje": "jugovzhodna_slovenija",
  "kočevsko": "jugovzhodna_slovenija",
  "ribnica": "jugovzhodna_slovenija",
  "metlika": "jugovzhodna_slovenija",
  "črnomelj": "jugovzhodna_slovenija",

  // ── Osrednjeslovenska ──
  osrednjeslovenska: "osrednjeslovenska",
  ljubljana: "osrednjeslovenska",
  domžale: "osrednjeslovenska",
  kamnik: "osrednjeslovenska",
  "barje": "osrednjeslovenska",
  "ljubljansko barje": "osrednjeslovenska",
  grosuplje: "osrednjeslovenska",
  vrhnika: "osrednjeslovenska",
  logatec: "osrednjeslovenska",
  "škofljica": "osrednjeslovenska",
  medvode: "osrednjeslovenska",
  litija: "osrednjeslovenska",
};

// Neighboring region graph — for Smart Fallback when requested region is empty
export const NEIGHBORING_REGIONS: Record<Regija, Regija[]> = {
  gorenjska: ["osrednjeslovenska", "savinjska", "koroska"],
  primorska: ["notranjska", "osrednjeslovenska", "koroska"],
  stajerska: ["pomurska", "savinjska", "koroska", "posavska"],
  dolenjska: ["osrednjeslovenska", "posavska", "jugovzhodna_slovenija", "notranjska"],
  koroska: ["stajerska", "savinjska", "gorenjska"],
  savinjska: ["stajerska", "koroska", "gorenjska", "osrednjeslovenska", "zasavska"],
  pomurska: ["stajerska"],
  notranjska: ["primorska", "osrednjeslovenska", "dolenjska"],
  zasavska: ["savinjska", "osrednjeslovenska", "posavska"],
  posavska: ["savinjska", "zasavska", "dolenjska", "stajerska"],
  jugovzhodna_slovenija: ["dolenjska", "osrednjeslovenska", "notranjska"],
  osrednjeslovenska: ["gorenjska", "savinjska", "zasavska", "dolenjska", "notranjska", "primorska"],
};
