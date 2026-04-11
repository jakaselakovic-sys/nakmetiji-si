// =============================================================================
// NaKmetiji.si — Zod v4 Validation Schemas: Vendor Dashboard Forms
//
// All error messages are in Slovenian.
// Import into client components and call .safeParse() on submit.
// =============================================================================

import { z } from "zod";

// ─── Regija enum — hardcoded tuple so Zod v4 z.enum() receives a const array ─
// (REGIJE is Regija[] which isn't a const tuple; z.enum requires [T, ...T[]])

const REGIJA_VALUES = [
  "gorenjska", "primorska", "stajerska", "dolenjska", "koroska",
  "savinjska", "pomurska", "notranjska", "zasavska", "posavska",
  "jugovzhodna_slovenija", "osrednjeslovenska",
] as const;

const regijaEnum = z.enum(REGIJA_VALUES, {
  message: "Izberite veljavno regijo.",
});

// ─── Edit Farm (UrediKmetijoView) ─────────────────────────────────────────────

export const kmetijaEditSchema = z.object({
  ime: z
    .string({ message: "Ime kmetije je obvezno." })
    .min(3, "Ime mora imeti vsaj 3 znake.")
    .max(100, "Ime je predolgo (največ 100 znakov)."),

  kratki_opis: z
    .string()
    .max(200, "Kratki opis je predolg (največ 200 znakov).")
    .optional()
    .or(z.literal("")),

  opis: z
    .string({ message: "Podroben opis je obvezen." })
    .min(50, "Opis mora imeti vsaj 50 znakov.")
    .max(5000, "Opis je predolg (največ 5000 znakov)."),

  regija: regijaEnum,

  naslov: z.string().max(200, "Naslov je predolg.").optional().or(z.literal("")),

  obcina: z.string().max(100, "Ime občine je predolgo.").optional().or(z.literal("")),

  postna_stevilka: z
    .string()
    .regex(/^(\d{4})?$/, "Poštna številka mora imeti natanko 4 cifre (npr. 4260).")
    .optional()
    .or(z.literal("")),

  kontakt_telefon: z.string().max(30, "Telefonska številka je predolga.").optional().or(z.literal("")),

  kontakt_email: z
    .union([z.string().email("Vnesite veljaven e-poštni naslov."), z.literal("")])
    .optional(),

  kontakt_spletna_stran: z
    .union([
      z.string().url("Vnesite veljavno spletno stran (mora se začeti s https://)."),
      z.literal(""),
    ])
    .optional(),

  cena_noc: z
    .number({ message: "Cena mora biti število." })
    .min(0, "Cena ne sme biti negativna.")
    .max(10_000, "Cena je previsoka (max 10.000 €/noč).")
    .nullable()
    .optional(),

  max_gostov: z
    .number({ message: "Vnesi veljavno število." })
    .int("Število gostov mora biti celo število.")
    .min(1, "Kmetija mora sprejeti vsaj 1 gosta.")
    .max(500, "Vrednost je previsoka (max 500).")
    .nullable()
    .optional(),

  iban: z
    .string()
    .regex(
      /^(SI[0-9]{17})?$/,
      "IBAN mora biti v obliki SI56 + 15 številk (npr. SI56020170014356205)."
    )
    .optional()
    .or(z.literal("")),

  bic: z.string().max(11, "BIC/SWIFT koda je predolga.").optional().or(z.literal("")),

  dozivetja_ids: z.array(z.string()),
});

export type KmetijaEditFormData = z.infer<typeof kmetijaEditSchema>;

// ─── Password change (SettingsView) ──────────────────────────────────────────

export const gesloSchema = z
  .object({
    novoGeslo: z
      .string({ message: "Geslo je obvezno." })
      .min(8, "Geslo mora imeti vsaj 8 znakov.")
      .max(128, "Geslo je predolgo."),
    potrdiGeslo: z.string({ message: "Potrdite geslo." }),
  })
  .refine((d) => d.novoGeslo === d.potrdiGeslo, {
    message: "Gesli se ne ujemata.",
    path: ["potrdiGeslo"],
  });

export type GesloFormData = z.infer<typeof gesloSchema>;

// ─── Profile name (SettingsView) ─────────────────────────────────────────────

export const profilSchema = z.object({
  ime: z
    .string({ message: "Ime je obvezno." })
    .min(2, "Ime mora imeti vsaj 2 znaka.")
    .max(100, "Ime je predolgo."),
});

export type ProfilFormData = z.infer<typeof profilSchema>;

// ─── Product / Izdelek ────────────────────────────────────────────────────────

export const izdelekSchema = z.object({
  ime: z
    .string({ message: "Ime izdelka je obvezno." })
    .min(2, "Ime mora imeti vsaj 2 znaka.")
    .max(100, "Ime je predolgo."),

  opis: z.string().max(500, "Opis je predolg (največ 500 znakov).").optional().or(z.literal("")),

  cena: z
    .number({ message: "Cena mora biti število." })
    .min(0.01, "Cena mora biti večja od 0.")
    .max(10_000, "Cena je previsoka."),

  enota: z
    .string({ message: "Enota je obvezna." })
    .min(1, "Enota je obvezna.")
    .max(20, "Enota je predolga."),

  kategorija: z.string({ message: "Kategorija je obvezna." }),

  zaloga: z
    .number({ message: "Zaloga mora biti celo število." })
    .int("Zaloga mora biti celo število.")
    .min(0, "Zaloga ne sme biti negativna."),

  na_voljo: z.boolean(),
});

export type IzdelekFormData = z.infer<typeof izdelekSchema>;
