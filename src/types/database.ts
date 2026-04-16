// =============================================================================
// NaKmetiji.si — Database Types (TypeScript)
// Tipi ki odražajo Supabase PostgreSQL shemo
// =============================================================================

// ─── Regije Slovenije ───────────────────────────────────────────────────────

export type Regija =
  | "gorenjska"
  | "primorska"
  | "stajerska"
  | "dolenjska"
  | "koroska"
  | "savinjska"
  | "pomurska"
  | "notranjska"
  | "zasavska"
  | "posavska"
  | "jugovzhodna_slovenija"
  | "osrednjeslovenska";

/** Prikazna imena regij (slovenščina z diakritiki) */
export const REGIJA_LABELS: Record<Regija, string> = {
  gorenjska: "Gorenjska",
  primorska: "Primorska",
  stajerska: "Štajerska",
  dolenjska: "Dolenjska",
  koroska: "Koroška",
  savinjska: "Savinjska",
  pomurska: "Pomurska",
  notranjska: "Notranjska",
  zasavska: "Zasavska",
  posavska: "Posavska",
  jugovzhodna_slovenija: "Jugovzhodna Slovenija",
  osrednjeslovenska: "Osrednjeslovenska",
};

/** Vseh 12 regij kot array za select/filter komponente */
export const REGIJE: Regija[] = Object.keys(REGIJA_LABELS) as Regija[];

// ─── Kontaktni podatki (JSONB) ──────────────────────────────────────────────

export interface KontaktniPodatki {
  telefon?: string;
  email?: string;
  spletna_stran?: string;
  instagram?: string;
  facebook?: string;
}

// ─── Doživetje (Experience category) ────────────────────────────────────────

export interface Dozivetje {
  id: string;
  ime: string;
  slug: string;
  ikona: string; // lucide-react icon name
  opis: string | null;
  vrstni_red: number;
  ustvarjeno: string;
  posodobljeno: string;
}

// ─── Kmetija (Farm listing) ─────────────────────────────────────────────────

export interface Kmetija {
  // Identiteta
  id: string;
  slug: string;

  // Vsebina
  ime: string;
  kratki_opis: string | null;
  opis: string;

  // Lokacija
  regija: Regija;
  naslov: string | null;
  obcina: string | null;
  postna_stevilka: string | null;
  lat: number | null;
  lng: number | null;

  // Mediji
  naslovna_slika: string;
  slike: string[];
  video_url: string | null;

  // Kontakt
  kontaktni_podatki: KontaktniPodatki;

  // Cene & zmogljivost
  cena_noc: number | null;
  max_gostov: number | null;

  // Bančni podatki (za UPN plačilni nalog)
  iban: string | null;
  bic: string | null;

  // Ocene & Status
  ocena: number | null;
  stevilo_ocen: number;
  premium: boolean;
  paket?: KmetijaPaket;
  aktivna: boolean;

  // Metadata
  lastnik_id: string | null;
  ustvarjeno: string;
  posodobljeno: string;
}

/** Kmetija z doživetji (JOIN rezultat) */
export interface KmetijaSDozivetji extends Kmetija {
  dozivetja: Dozivetje[];
}

/** Kmetija z doživetji in mnenji */
export interface KmetijaPolna extends KmetijaSDozivetji {
  mnenja: Mnenje[];
  izdelki?: Izdelek[];
}

// ─── Kmetija-Doživetje (Many-to-Many pivot) ─────────────────────────────────

export interface KmetijaDozivetje {
  kmetija_id: string;
  dozivetje_id: string;
}

// ─── Mnenje (Review) ────────────────────────────────────────────────────────

export type MnenjeStatus = "cakanje" | "odobreno" | "zavrnjeno";

export interface Mnenje {
  id: string;
  kmetija_id: string;
  uporabnik_id?: string | null;
  uporabnik_ime: string;
  uporabnik_email: string | null;
  ocena: number; // 1–5
  komentar: string | null;
  status: MnenjeStatus;
  datum: string;
}

// ─── Izdelek (Product) ──────────────────────────────────────────────────────

export type IzdelekKategorija =
  | "mlecni_izdelki"
  | "mesni_izdelki"
  | "sadje_zelenjava"
  | "med_cebelji_izdelki"
  | "vino_pijace"
  | "pekovski_izdelki"
  | "olja_kis"
  | "domaca_kosmerika"
  | "ostalo";

export const IZDELEK_KATEGORIJA_LABELS: Record<IzdelekKategorija, string> = {
  mlecni_izdelki: "Mlečni izdelki",
  mesni_izdelki: "Mesni izdelki",
  sadje_zelenjava: "Sadje & zelenjava",
  med_cebelji_izdelki: "Med & čebelji izdelki",
  vino_pijace: "Vino & pijače",
  pekovski_izdelki: "Pekovski izdelki",
  olja_kis: "Olja & kis",
  domaca_kosmerika: "Domača kozmetika",
  ostalo: "Ostalo",
};

export interface Izdelek {
  id: string;
  kmetija_id: string;
  ime: string;
  opis: string | null;
  cena: number;          // v EUR
  enota: string;         // npr. "kg", "kos", "liter", "kozarec"
  kategorija: IzdelekKategorija;
  zaloga: number;        // 0 = ni na voljo
  na_voljo: boolean;
  slika_url: string | null;
  ustvarjeno: string;
  posodobljeno: string;
}

// ─── Rezervacija (Booking) ──────────────────────────────────────────────────

export type RezervacijaStatus =
  | "cakanje"       // čakanje na potrditev
  | "potrjena"      // kmetija potrdila
  | "zavrnjena"     // kmetija zavrnila
  | "preklicana"    // gost preklical
  | "zakljucena";   // obisk opravljen

export const REZERVACIJA_STATUS_LABELS: Record<RezervacijaStatus, string> = {
  cakanje: "Čaka na potrditev",
  potrjena: "Potrjena",
  zavrnjena: "Zavrnjena",
  preklicana: "Preklicana",
  zakljucena: "Zaključena",
};

export interface Rezervacija {
  id: string;
  kmetija_id: string;
  gost_ime: string;
  gost_email: string;
  gost_telefon: string | null;
  stevilo_oseb: number;
  datum_od: string;       // ISO date
  datum_do: string;       // ISO date
  opombe: string | null;  // posebne želje
  skupaj_cena: number | null;
  status: RezervacijaStatus;
  ustvarjeno: string;
  posodobljeno: string;
}

// ─── Input tipi (za ustvarjanje, brez server-managed polj) ─────────────────

export type UstvariKmetijoInput = Omit<
  Kmetija,
  "id" | "slug" | "ocena" | "stevilo_ocen" | "aktivna" | "ustvarjeno" | "posodobljeno"
>;

export type PosodobiKmetijoInput = Partial<UstvariKmetijoInput>;

export type UstvariMnenjeInput = Pick<
  Mnenje,
  "kmetija_id" | "uporabnik_ime" | "uporabnik_email" | "ocena" | "komentar"
>;

export type UstvariIzdelekInput = Omit<
  Izdelek,
  "id" | "ustvarjeno" | "posodobljeno"
>;

export type PosodobiIzdelekInput = Partial<UstvariIzdelekInput>;

export type UstvariRezervacijoInput = Omit<
  Rezervacija,
  "id" | "status" | "ustvarjeno" | "posodobljeno"
>;

// ─── Filter & Query tipi ────────────────────────────────────────────────────

export interface KmetijeFilter {
  regija?: Regija | Regija[];
  dozivetje?: string | string[]; // slug doživetja
  iskanje?: string; // full-text search
  premium?: boolean;
  paket?: KmetijaPaket;
  ocenaMin?: number;
  sortiranje?: "ocena" | "ime" | "najnovejse";
  smer?: "asc" | "desc";
  stran?: number;
  naStran?: number;
}

export interface IzdelkiFilter {
  kmetija_id?: string;
  kategorija?: IzdelekKategorija;
  naVoljo?: boolean;
  cenaMin?: number;
  cenaMax?: number;
  iskanje?: string;
}

export interface RezervacijeFilter {
  kmetija_id?: string;
  status?: RezervacijaStatus;
  datumOd?: string;
  datumDo?: string;
}

export interface PaginiraniRezultat<T> {
  podatki: T[];
  skupaj: number;
  stran: number;
  naStran: number;
  skupajStrani: number;
}

// =============================================================================
// AI SEMANTIC LAYER — pgvector extensions to Kmetija
// =============================================================================

/** Vibe labels used for pgvector pre-filtering */
export type VibeTip =
  | "rusticna"
  | "moderna"
  | "tiha"
  | "druzinska"
  | "romanticna"
  | "pustolovska"
  | "eko"
  | "luksuzna";

/** Extended Kmetija with AI fields (returned after embedding generation) */
export interface KmetijaZAI extends Kmetija {
  vibe_tags: VibeTip[];
  ai_opis: string | null;
  embedding_updated_at: string | null;
  // Note: embedding (vector) column not typed here — handled server-side only
}

// =============================================================================
// GREEN PASSPORT SYSTEM
// =============================================================================

export interface PotniListRegija {
  id: string;
  slug: string;
  ime: string;
  opis: string | null;
  emoji: string | null;
  barva_hex: string;
  zahteva_regija: Regija;
  xp_nagrada: number;
  ustvarjeno: string;
}

export type ZnackaTip = "regija" | "dosezek" | "sezonska" | "posebna";

export interface ZnackaPogoj {
  min_obiskov?: number;
  vse_regije?: boolean;
  regija?: Regija;
}

export interface Znacka {
  id: string;
  slug: string;
  ime: string;
  opis: string | null;
  ikona_url: string | null;
  tip: ZnackaTip;
  pogoj_json: ZnackaPogoj;
  xp_vrednost: number;
  ustvarjeno: string;
}

export interface PotniListZig {
  id: string;
  profil_id: string;
  regija_id: string;
  kmetija_id: string;
  rezervacija_id: string | null;
  datum_prisluzeno: string;
  // Joined
  regija?: PotniListRegija;
  kmetija?: Pick<Kmetija, "id" | "ime" | "slug" | "naslovna_slika">;
}

export interface UporabnikDosezek {
  id: string;
  profil_id: string;
  znacka_id: string;
  rezervacija_id: string | null;
  prisluzeno: string;
  // Joined
  znacka?: Znacka;
}

export interface PotniList {
  zigi: PotniListZig[];
  dosezki: UporabnikDosezek[];
  xp_tocke: number;
  nivo: number;
  skupaj_obiskov: number;
}

// =============================================================================
// MULTILINGUAL TRANSLATIONS
// =============================================================================

export type Jezik = "sl" | "en" | "de" | "it";

export interface Prevod {
  id: string;
  tabela: "kmetije" | "dozivetja" | "izdelki";
  vrstica_id: string;
  jezik: Jezik;
  polje: string;
  vsebina: string;
  ai_prevod: boolean;
  ustvarjeno: string;
  posodobljeno: string;
}

// =============================================================================
// REVENUE TRACKING
// =============================================================================

export type TransakcijaTip =
  | "komisija"
  | "izplacilo"
  | "ai_agencija"
  | "vracilo"
  | "premium_narocnina";

export type TransakcijaStatus = "cakanje" | "obdelana" | "neuspesna" | "vrnjena";

export interface Transakcija {
  id: string;
  rezervacija_id: string | null;
  lastnik_id: string | null;
  tip: TransakcijaTip;
  bruto_znesek: number;
  komisija_odstotek: number;
  komisija_znesek: number;
  neto_znesek: number;
  status: TransakcijaStatus;
  stripe_payment_id: string | null;
  stripe_transfer_id: string | null;
  opombe: string | null;
  ustvarjeno: string;
  obdelano: string | null;
}

export interface TransakcijaFilter {
  lastnik_id?: string;
  status?: TransakcijaStatus;
  tip?: TransakcijaTip;
  od?: string;
  do?: string;
}

// Convenience: revenue summary for vendor dashboard
export interface PrihodkiPovzetek {
  bruto_skupaj: number;
  komisija_skupaj: number;
  neto_skupaj: number;
  stevilo_transakcij: number;
  cakajocih_izplacil: number;
}

// ─── Supabase generated types helper ────────────────────────────────────────

/** Database schema mapping for Supabase type generation */
export interface Database {
  public: {
    Tables: {
      kmetije: {
        Row: Kmetija;
        Insert: Omit<Kmetija, "id" | "ustvarjeno" | "posodobljeno">;
        Update: Partial<Omit<Kmetija, "id" | "ustvarjeno" | "posodobljeno">>;
      };
      dozivetja: {
        Row: Dozivetje;
        Insert: Omit<Dozivetje, "id" | "ustvarjeno" | "posodobljeno">;
        Update: Partial<Omit<Dozivetje, "id" | "ustvarjeno" | "posodobljeno">>;
      };
      kmetija_dozivetje: {
        Row: KmetijaDozivetje;
        Insert: KmetijaDozivetje;
        Update: never;
      };
      mnenja: {
        Row: Mnenje;
        Insert: Omit<Mnenje, "id" | "datum">;
        Update: Partial<Omit<Mnenje, "id" | "datum">>;
      };
      izdelki: {
        Row: Izdelek;
        Insert: Omit<Izdelek, "id" | "ustvarjeno" | "posodobljeno">;
        Update: Partial<Omit<Izdelek, "id" | "ustvarjeno" | "posodobljeno">>;
      };
      rezervacije: {
        Row: Rezervacija;
        Insert: Omit<Rezervacija, "id" | "ustvarjeno" | "posodobljeno">;
        Update: Partial<Omit<Rezervacija, "id" | "ustvarjeno" | "posodobljeno">>;
      };
      znamenitosti: {
        Row: import("./landmarks").Znamenitost;
        Insert: Omit<import("./landmarks").Znamenitost, "id">;
        Update: Partial<Omit<import("./landmarks").Znamenitost, "id">>;
      };
      potni_list_regije: {
        Row: PotniListRegija;
        Insert: Omit<PotniListRegija, "id" | "ustvarjeno">;
        Update: Partial<Omit<PotniListRegija, "id" | "ustvarjeno">>;
      };
      znacke: {
        Row: Znacka;
        Insert: Omit<Znacka, "id" | "ustvarjeno">;
        Update: Partial<Omit<Znacka, "id" | "ustvarjeno">>;
      };
      potni_list_zigi: {
        Row: PotniListZig;
        Insert: Omit<PotniListZig, "id" | "datum_prisluzeno">;
        Update: never;
      };
      uporabnik_dosezki: {
        Row: UporabnikDosezek;
        Insert: Omit<UporabnikDosezek, "id" | "prisluzeno">;
        Update: never;
      };
      prevodi: {
        Row: Prevod;
        Insert: Omit<Prevod, "id" | "ustvarjeno" | "posodobljeno">;
        Update: Partial<Pick<Prevod, "vsebina" | "ai_prevod">>;
      };
      transakcije: {
        Row: Transakcija;
        Insert: Omit<Transakcija, "id" | "ustvarjeno">;
        Update: Pick<Transakcija, "status" | "stripe_payment_id" | "stripe_transfer_id" | "obdelano" | "opombe">;
      };
    };
    Enums: {
      regija_enum: Regija;
      izdelek_kategorija_enum: IzdelekKategorija;
      rezervacija_status_enum: RezervacijaStatus;
      znacka_tip: ZnackaTip;
      jezik_enum: Jezik;
      transakcija_tip: TransakcijaTip;
      transakcija_status: TransakcijaStatus;
    };
  };
}


export type KmetijaPaket = 'free' | 'basic' | 'premium';
