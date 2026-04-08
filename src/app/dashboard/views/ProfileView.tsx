"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import {
  Farm,
  REGION_LABELS,
  EXPERIENCE_LABELS,
  Region,
} from "@/types";
import type { ExperienceTag } from "@/types";

/* ── Form data type ──────────────────────────────────────────────────── */

interface ProfileFormData {
  name: string;
  tagline: string;
  description: string;
  region: string;
  address: string;
  municipality: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  videoUrl: string;
}

/* ── Experience icons ────────────────────────────────────────────────── */

const EXP_ICONS: Record<ExperienceTag, string> = {
  vino: "🍷",
  prenocisce: "🛏️",
  druzine: "👨‍👩‍👧‍👦",
  kulinarika: "🍽️",
  wellness: "🧖",
  sport: "🏔️",
  zivali: "🐄",
  delavnice: "🎨",
  ekologija: "🌿",
  prireditve: "🎉",
};

/* ══════════════════════════════════════════════════════════════════════ */

export function ProfileView({ farm }: { farm: Farm }) {
  const [saved, setSaved] = useState(false);
  const [selectedExperiences, setSelectedExperiences] = useState<ExperienceTag[]>(
    [...farm.experiencesOffered]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: farm.name,
      tagline: farm.tagline ?? "",
      description: farm.description.replace(/\n\n/g, "\n\n"),
      region: farm.region,
      address: farm.address ?? "",
      municipality: farm.municipality ?? "",
      postalCode: farm.postalCode ?? "",
      phone: farm.contact?.phone ?? "",
      email: farm.contact?.email ?? "",
      website: farm.contact?.website ?? "",
      instagram: farm.contact?.instagram ?? "",
      facebook: farm.contact?.facebook ?? "",
      videoUrl: farm.videoUrl ?? "",
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    // Simulated save
    console.log("Saved:", { ...data, experiencesOffered: selectedExperiences });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleExperience = (tag: ExperienceTag) => {
    setSelectedExperiences((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  /* ── Field wrapper ─────────────────────────────────────────────────── */

  const Field = ({
    label,
    id,
    children,
    hint,
    error,
    required,
  }: {
    label: string;
    id: string;
    children: React.ReactNode;
    hint?: string;
    error?: string;
    required?: boolean;
  }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-forest-900 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-[11px] text-earth-400">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-[11px] text-red-500 font-medium">{error}</p>
      )}
    </div>
  );

  const inputClass =
    "w-full rounded-xl border border-earth-200 bg-white px-4 py-3 text-sm text-forest-900 placeholder:text-earth-400 outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-200 transition-all";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      {/* ── Section: Osnovni podatki ───────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          title="Osnovni podatki"
          description="Ime, opis in lokacija vaše kmetije"
        />

        <div className="mt-6 grid grid-cols-1 gap-5">
          <Field label="Ime kmetije" id="name" required error={errors.name?.message}>
            <input
              id="name"
              type="text"
              className={inputClass}
              {...register("name", { required: "Ime je obvezno" })}
            />
          </Field>

          <Field label="Slogan" id="tagline" hint="Kratek slogan prikazan na karticah (maks. 120 znakov)">
            <input
              id="tagline"
              type="text"
              maxLength={120}
              className={inputClass}
              placeholder="npr. Okusi pristne Gorenjske v objemu Alp"
              {...register("tagline")}
            />
          </Field>

          <Field label="Opis kmetije" id="description" required error={errors.description?.message}>
            <textarea
              id="description"
              rows={8}
              className={`${inputClass} resize-none`}
              placeholder="Opišite vašo kmetijo, ponudbo in okolico..."
              {...register("description", {
                required: "Opis je obvezen",
                minLength: { value: 50, message: "Opis mora imeti vsaj 50 znakov" },
              })}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Regija" id="region" required>
              <select
                id="region"
                className={`${inputClass} cursor-pointer appearance-none`}
                {...register("region", { required: true })}
              >
                {Object.entries(REGION_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Občina" id="municipality">
              <input
                id="municipality"
                type="text"
                className={inputClass}
                {...register("municipality")}
              />
            </Field>

            <Field label="Poštna številka" id="postalCode">
              <input
                id="postalCode"
                type="text"
                className={inputClass}
                {...register("postalCode")}
              />
            </Field>
          </div>

          <Field label="Naslov" id="address">
            <input
              id="address"
              type="text"
              className={inputClass}
              placeholder="Ulica in hišna številka"
              {...register("address")}
            />
          </Field>
        </div>
      </section>

      {/* ── Section: Fotografije ──────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          title="Fotografije"
          description="Naslovna slika in galerija vaše kmetije"
        />

        <div className="mt-6 space-y-5">
          {/* Cover image */}
          <div>
            <p className="text-sm font-semibold text-forest-900 mb-3">Naslovna fotografija</p>
            <div className="relative aspect-[21/9] rounded-2xl overflow-hidden border-2 border-dashed border-earth-300 bg-earth-50 group hover:border-forest-400 transition-colors">
              <Image
                src={farm.coverImageUrl}
                alt="Naslovna fotografija"
                fill
                className="object-cover"
                sizes="800px"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 rounded-xl bg-white/90 backdrop-blur-sm px-5 py-3 text-sm font-semibold text-forest-800 shadow-lg hover:bg-white"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Zamenjaj naslovnico
                </button>
              </div>
            </div>
          </div>

          {/* Gallery */}
          <div>
            <p className="text-sm font-semibold text-forest-900 mb-3">
              Galerija
              <span className="ml-2 text-xs font-normal text-earth-400">
                ({farm.galleryImageUrls?.length ?? 0} fotografij)
              </span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {farm.galleryImageUrls?.map((url, i) => (
                <div
                  key={i}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-earth-200 shadow-sm"
                >
                  <Image
                    src={url}
                    alt={`Galerija ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <button
                      type="button"
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600"
                      title="Odstrani"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {/* Upload placeholder */}
              <button
                type="button"
                className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-earth-300 bg-earth-50/50 hover:border-forest-400 hover:bg-forest-50/50 transition-all group"
              >
                <svg
                  className="h-8 w-8 text-earth-400 group-hover:text-forest-500 transition-colors mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[11px] font-semibold text-earth-500 group-hover:text-forest-600 transition-colors">
                  Dodaj sliko
                </span>
              </button>
            </div>
          </div>

          {/* Video URL */}
          <Field label="Video URL" id="videoUrl" hint="YouTube ali Vimeo povezava">
            <input
              id="videoUrl"
              type="url"
              className={inputClass}
              placeholder="https://youtube.com/watch?v=..."
              {...register("videoUrl")}
            />
          </Field>
        </div>
      </section>

      {/* ── Section: Doživetja ────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          }
          title="Doživetja in ponudba"
          description="Izberite katere izkušnje ponujate obiskovalcem"
        />

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(
            Object.entries(EXPERIENCE_LABELS) as [ExperienceTag, string][]
          ).map(([key, label]) => {
            const active = selectedExperiences.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleExperience(key)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all duration-200 border ${
                  active
                    ? "bg-forest-50 border-forest-300 shadow-sm ring-1 ring-forest-200"
                    : "bg-white border-earth-200 hover:border-forest-200 hover:bg-forest-50/30"
                }`}
              >
                <span className="text-xl flex-shrink-0">{EXP_ICONS[key]}</span>
                <span
                  className={`flex-1 text-sm font-medium ${
                    active ? "text-forest-800" : "text-earth-700"
                  }`}
                >
                  {label}
                </span>
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all ${
                    active
                      ? "bg-forest-700 border-forest-700"
                      : "border-earth-300"
                  }`}
                >
                  {active && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Section: Kontakt ──────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          title="Kontaktni podatki"
          description="Kako vas gostje najdejo"
        />

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Telefon" id="phone">
            <input id="phone" type="tel" className={inputClass} placeholder="+386 ..." {...register("phone")} />
          </Field>

          <Field label="E-pošta" id="email" required error={errors.email?.message}>
            <input
              id="email"
              type="email"
              className={inputClass}
              {...register("email", { required: "E-pošta je obvezna" })}
            />
          </Field>

          <Field label="Spletna stran" id="website">
            <input id="website" type="url" className={inputClass} placeholder="https://..." {...register("website")} />
          </Field>

          <Field label="Instagram" id="instagram">
            <input id="instagram" type="text" className={inputClass} placeholder="@vašprofil" {...register("instagram")} />
          </Field>

          <Field label="Facebook" id="facebook">
            <input id="facebook" type="text" className={inputClass} placeholder="Facebook stran" {...register("facebook")} />
          </Field>
        </div>
      </section>

      {/* ── Submit bar ────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 lg:bottom-0 -mx-6 lg:-mx-10 px-6 lg:px-10 py-4 bg-white/90 backdrop-blur-md border-t border-earth-200/60 flex items-center justify-between gap-4 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2">
          {saved && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-forest-600 animate-fade-in">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Spremembe shranjene
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-earth-600 hover:bg-earth-100 transition-colors"
          >
            Prekliči
          </button>
          <button
            type="submit"
            id="save-profile"
            className="rounded-xl bg-forest-700 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-forest-800/20 hover:bg-forest-600 hover:shadow-lg active:scale-[0.97] transition-all duration-200"
          >
            Shrani spremembe
          </button>
        </div>
      </div>
    </form>
  );
}

/* ── Section header sub-component ────────────────────────────────────── */

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-earth-200/60">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-50 text-forest-600 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold text-forest-900">{title}</h2>
        <p className="text-sm text-earth-500">{description}</p>
      </div>
    </div>
  );
}
