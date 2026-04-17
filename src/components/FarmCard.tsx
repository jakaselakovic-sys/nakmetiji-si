"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useInView } from "framer-motion";
import { Stamp } from "lucide-react";
import { EXPERIENCE_LABELS, type ExperienceTag } from "@/types";
import { BLUR_DATA_URL } from "@/lib/blur";

interface FarmCardData {
  slug: string;
  name: string;
  tagline?: string;
  region: string;
  coverImageUrl: string;
  experiencesOffered: ExperienceTag[];
  rating: number | null;
  reviewCount: number;
  isPremium: boolean;
}

const StarSVG = () => (
  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// Lazy spring entrance — triggers when card scrolls into view
const CARD_SPRING = { type: "spring" as const, stiffness: 100, damping: 18, mass: 0.8 };

const TILT_CLASSES = [
  "card-polaroid-tilt-1",
  "card-polaroid-tilt-2",
  "card-polaroid-tilt-3",
] as const;

export function FarmCard({ farm, priority, index = 0 }: { farm: FarmCardData; priority?: boolean; index?: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: "-60px" });

  // Magnetic pull — stiff spring so it snaps back decisively
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 350, damping: 35 });
  const springY = useSpring(mouseY, { stiffness: 350, damping: 35 });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - (rect.left + rect.width / 2)) * 0.045);
    mouseY.set((e.clientY - (rect.top + rect.height / 2)) * 0.045);
  }

  function onMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={CARD_SPRING}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      whileTap={{ scale: 0.98 }}
      style={{ x: springX, y: springY }}
      className={`group relative flex flex-col card-polaroid ${TILT_CLASSES[index % 3]} cursor-pointer`}
    >
      <Link
        href={`/kmetije/${farm.slug}`}
        id={`farm-card-${farm.slug}`}
        className="flex flex-col flex-1"
        tabIndex={0}
      >
        {/* Image */}
        <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden rounded-sm">
          <Image
            src={farm.coverImageUrl || "/images/bg-vineyards.webp"}
            alt={farm.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            priority={priority}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent opacity-60 group-hover:opacity-30 transition-opacity duration-500" />

          {/* Premium badge */}
          {farm.isPremium && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-gold-500/85 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_4px_18px_rgba(212,168,83,0.5)]">
              <StarSVG />
              Izpostavljeno
            </div>
          )}

          {/* Rating pill — offset glassmorphic badge */}
          <div className="absolute -bottom-3 right-4 flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md px-3.5 py-2 text-sm font-semibold text-forest-800 shadow-lg border border-earth-200/40 z-10">
            <svg className="h-4 w-4 text-gold-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {farm.rating ? farm.rating.toFixed(1) : "–"}
            <span className="text-xs text-earth-500 font-normal ml-0.5">({farm.reviewCount})</span>
          </div>

          {/* Passport stamp — appears on hover */}
          <div className="polaroid-stamp">
            <Stamp size={20} className="text-white" strokeWidth={1.5} />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col px-2 pt-5 pb-0">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-forest-600 mb-2">
            {farm.region}
          </span>

          <h3 className="text-lg font-bold text-forest-900 mb-1.5 group-hover:text-forest-700 transition-colors duration-300 line-clamp-1 font-display">
            {farm.name}
          </h3>

          <p className="text-sm text-earth-600 leading-relaxed mb-5 line-clamp-2">
            {farm.tagline}
          </p>

          <div className="mt-auto flex flex-wrap gap-1.5">
            {farm.experiencesOffered.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-forest-50 px-3 py-1 text-[11px] font-medium text-forest-700 ring-1 ring-forest-200/60"
              >
                {EXPERIENCE_LABELS[tag]}
              </span>
            ))}
            {farm.experiencesOffered.length > 3 && (
              <span className="inline-flex items-center rounded-full bg-earth-100 px-3 py-1 text-[11px] font-medium text-earth-600">
                +{farm.experiencesOffered.length - 3}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
