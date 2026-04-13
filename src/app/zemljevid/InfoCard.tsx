"use client";

// =============================================================================
// NaKmetiji.si — Glassmorphism Info Card
// Overlay kartica namesto standardnega popupa
// =============================================================================

import Image from "next/image";
import Link from "next/link";
import { X, Star, MapPin, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Farm } from "@/types";
import { REGION_LABELS, Region, EXPERIENCE_LABELS, type ExperienceTag } from "@/types";
import type { Znamenitost } from "@/types/landmarks";
import { ZNAMENITOST_KATEGORIJA_LABELS, ZNAMENITOST_IKONE } from "@/types/landmarks";
import { WeatherWidget } from "@/components/WeatherWidget";

interface FarmInfoCardProps {
  type: "farm";
  farm: Farm;
  onClose: () => void;
}

interface LandmarkInfoCardProps {
  type: "landmark";
  landmark: Znamenitost;
  onClose: () => void;
}

type InfoCardProps = FarmInfoCardProps | LandmarkInfoCardProps;

export function InfoCard(props: InfoCardProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={props.type === "farm" ? props.farm.slug : props.landmark.id}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute bottom-24 sm:bottom-6 right-6 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden glass-card shadow-2xl"
        style={{ zIndex: "var(--z-map-card)" }}
      >
        {props.type === "farm" ? (
          <FarmCard farm={props.farm} onClose={props.onClose} />
        ) : (
          <LandmarkCard landmark={props.landmark} onClose={props.onClose} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function FarmCard({ farm, onClose }: { farm: Farm; onClose: () => void }) {
  const regionLabel = REGION_LABELS[farm.region as Region] ?? farm.region;

  return (
    <>
      {/* Cover image */}
      <div className="relative h-[140px]">
        <Image
          src={farm.coverImageUrl}
          alt={farm.name}
          fill
          className="object-cover"
          sizes="340px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {farm.isPremium && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-gold-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            <Star size={10} fill="currentColor" /> Premium
          </div>
        )}
        {farm.rating && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[12px] font-bold text-forest-800">
            <Star size={12} className="fill-gold-500 text-gold-500" />
            {farm.rating.toFixed(1)}
            <span className="text-earth-400 font-normal">({farm.reviewCount})</span>
          </div>
        )}
        <button
          onClick={onClose}
          aria-label="Zapri"
          className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-forest-600 mb-1">
          <MapPin size={12} />
          {regionLabel}
        </div>
        <h3 className="text-[16px] font-bold text-forest-900 leading-tight mb-1">
          {farm.name}
        </h3>
        {farm.tagline && (
          <p className="text-[12px] text-earth-600 leading-relaxed mb-3 line-clamp-2">
            {farm.tagline}
          </p>
        )}

        {/* Experience pills */}
        <div className="flex flex-wrap gap-1 mb-3">
          {farm.experiencesOffered.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-full bg-forest-50 px-2 py-0.5 text-[10px] font-medium text-forest-700 ring-1 ring-forest-200/60"
            >
              {EXPERIENCE_LABELS[tag as ExperienceTag]}
            </span>
          ))}
          {farm.experiencesOffered.length > 3 && (
            <span className="inline-block rounded-full bg-earth-50 px-2 py-0.5 text-[10px] font-medium text-earth-500">
              +{farm.experiencesOffered.length - 3}
            </span>
          )}
        </div>

        {/* Weather for this farm's location */}
        {farm.location && (
          <div className="mb-4 rounded-xl bg-sky-50/60 border border-sky-100/80 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-600 mb-2">
              Vreme na kmetiji
            </p>
            <WeatherWidget
              lat={farm.location.latitude}
              lng={farm.location.longitude}
              compact
            />
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/kmetije/${farm.slug}`}
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-forest-700 py-2.5 text-[13px] font-bold text-white hover:bg-forest-600 transition-colors"
        >
          Poglej profil
          <ArrowRight size={14} />
        </Link>
      </div>
    </>
  );
}

function LandmarkCard({
  landmark,
  onClose,
}: {
  landmark: Znamenitost;
  onClose: () => void;
}) {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {ZNAMENITOST_IKONE[landmark.kategorija]}
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-earth-400">
              {ZNAMENITOST_KATEGORIJA_LABELS[landmark.kategorija]}
            </p>
            <h3 className="text-[15px] font-bold text-forest-900 leading-tight">
              {landmark.ime}
            </h3>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Zapri"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-earth-100 text-earth-500 hover:bg-earth-200 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      {landmark.opis && (
        <p className="text-[12px] text-earth-600 leading-relaxed mb-2">
          {landmark.opis}
        </p>
      )}
      {landmark.zanimivost && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 mt-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600 mb-0.5">Zanimivost</p>
          <p className="text-[11px] text-amber-800 leading-relaxed">{landmark.zanimivost}</p>
        </div>
      )}
    </div>
  );
}
