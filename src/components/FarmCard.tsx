import Image from "next/image";
import Link from "next/link";
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

export function FarmCard({ farm }: { farm: FarmCardData }) {
  return (
    <Link
      href={`/kmetije/${farm.slug}`}
      id={`farm-card-${farm.slug}`}
      className="group relative flex flex-col rounded-2xl bg-white shadow-md shadow-earth-200/60 border border-earth-200/60 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-forest-200/30 hover:-translate-y-1.5 hover:border-forest-200"
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={farm.coverImageUrl}
          alt={farm.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

        {/* Premium badge */}
        {farm.isPremium && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-gold-500/90 backdrop-blur-sm px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg">
            <svg
              className="h-3.5 w-3.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Izpostavljeno
          </div>
        )}

        {/* Rating pill */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-sm font-semibold text-forest-800 shadow-md">
          <svg
            className="h-4 w-4 text-gold-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {farm.rating ? farm.rating.toFixed(1) : "-"}
          <span className="text-xs text-earth-500 font-normal ml-0.5">
            ({farm.reviewCount})
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Region label */}
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-forest-600 mb-1.5">
          📍 {farm.region}
        </span>

        {/* Name */}
        <h3 className="text-lg font-bold text-forest-900 mb-1 group-hover:text-forest-700 transition-colors duration-300 line-clamp-1">
          {farm.name}
        </h3>

        {/* Tagline */}
        <p className="text-sm text-earth-600 leading-relaxed mb-4 line-clamp-2">
          {farm.tagline}
        </p>

        {/* Experience tags */}
        <div className="mt-auto flex flex-wrap gap-1.5">
          {farm.experiencesOffered.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-forest-50 px-2.5 py-1 text-[11px] font-medium text-forest-700 ring-1 ring-forest-200/60"
            >
              {EXPERIENCE_LABELS[tag]}
            </span>
          ))}
          {farm.experiencesOffered.length > 3 && (
            <span className="inline-flex items-center rounded-full bg-earth-100 px-2.5 py-1 text-[11px] font-medium text-earth-600">
              +{farm.experiencesOffered.length - 3}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
