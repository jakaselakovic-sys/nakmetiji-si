// =============================================================================
// NaKmetiji.si — ReservationDemoSplit
// 60/40 split: lifestyle image + tilted handwritten testimonial (left)
// and the existing MockBookingForm (right). Wrapped in paper texture +
// watercolor ornaments so the section feels like a scrapbook spread.
// =============================================================================

import Image from "next/image";
import { BackgroundOrnaments } from "@/components/BackgroundOrnaments";
import { MockBookingForm, type BookingFormProps } from "@/components/MockBookingForm";

const LIFESTYLE_BLUR =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

export function ReservationDemoSplit(props: BookingFormProps) {
  return (
    <section className="relative overflow-hidden bg-paper py-24 px-6 texture-paper noise-overlay">
      <BackgroundOrnaments variant="reservation" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section heading */}
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100/80 border border-amber-200 text-amber-800 text-xs font-bold mb-5">
            Demo rezervacijski sistem
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-forest-900 mb-4 font-display tracking-tight">
            Rezervirajte kot pri tetki
          </h2>
          <p className="text-earth-600 mx-auto text-base leading-relaxed">
            Vnesite testne podatke in doživite celoten UX — od izbire datuma do lažne potrditve.
            Noben email ni poslan, nič ni shranjeno.
          </p>
        </div>

        {/* 60/40 split */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10 lg:gap-14 items-start">
          {/* ── Left: lifestyle + testimonial scrapbook spread ─────────── */}
          <div className="relative">
            {/* Lifestyle photo framed as a polaroid */}
            <div className="card-polaroid journal-tilt-l relative max-w-[620px] mx-auto lg:mx-0">
              <span className="tape-strip tape-strip-tl" aria-hidden="true" />
              <span className="tape-strip tape-strip-tr" aria-hidden="true" />
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm">
                <Image
                  src="/images/bg-vineyards.webp"
                  alt="Vinorodni griči ob sončnem zahodu"
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL={LIFESTYLE_BLUR}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/30 via-transparent to-transparent" />
              </div>
              {/* Caption under the photo — handwritten */}
              <p className="handwritten text-forest-800 text-2xl mt-3 px-2 text-center">
                Jesenski dan pri Pr&apos; Planšar — oktober 2025
              </p>
            </div>

            {/* Floating handwritten testimonial — journal card */}
            <div className="relative mt-6 lg:mt-10 lg:-ml-4 max-w-[460px] mx-auto lg:mx-0">
              <div className="card-polaroid journal-tilt-r relative bg-[#fdf8ee] p-7 pb-10">
                <span className="tape-strip tape-strip-tl" aria-hidden="true" />
                <div className="flex items-start gap-1">
                  <span className="font-display text-5xl leading-none text-forest-700/70 mr-1 -mt-1">
                    &ldquo;
                  </span>
                  <p className="handwritten text-xl text-earth-800 leading-snug">
                    Prispeli smo utrujeni od mesta — odšli z jabolki v vrečki in
                    obljubami, da se vrnemo spomladi.
                  </p>
                </div>
                <div className="flex items-center justify-between mt-5 pt-3 border-t border-dashed border-earth-300">
                  <div>
                    <p className="text-sm font-bold text-forest-900 font-display">
                      Ana &amp; Miha
                    </p>
                    <p className="text-xs text-earth-500">Ljubljana · 2 noči</p>
                  </div>
                  <span className="ink-stamp text-[11px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded">
                    Overjeno
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: the actual form ─────────────────────────────────── */}
          <div className="relative lg:pt-6">
            <MockBookingForm {...props} />
          </div>
        </div>
      </div>
    </section>
  );
}
