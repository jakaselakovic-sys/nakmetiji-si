// =============================================================================
// NaKmetiji.si — Root Layout
// =============================================================================

import { Suspense } from "react";
import type { Metadata } from "next";
import { Montserrat, Geist_Mono, Cormorant_Garamond, Caveat } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OracleConcierge } from "@/components/OracleConcierge";
import { DemoBanner, DemoFooterStrip } from "@/components/DemoDisclaimer";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { PageTransition } from "@/components/PageTransition";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-script",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nakmetiji.si"),
  title: {
    default: "NaKmetiji — Odkrijte turistične kmetije v Sloveniji",
    template: "%s | NaKmetiji",
  },
  description:
    "NaKmetiji je vodilna platforma za odkrivanje turističnih kmetij po vsej Sloveniji. " +
    "Najdite prenočišča, kulinarična doživetja, degustacije vin in družinsko zabavo na podeželju.",
  keywords: [
    "turistična kmetija",
    "Slovenija",
    "podeželski turizem",
    "kmečki turizem",
    "prenočišče",
    "kulinarika",
    "vino",
    "Gorenjska",
    "Primorska",
    "Štajerska",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NaKmetiji",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    type: "website",
    locale: "sl_SI",
    siteName: "NaKmetiji",
    title: "NaKmetiji — Odkrijte turistične kmetije v Sloveniji",
    description:
      "Najdite popolno turistično kmetijo za nepozaben oddih. Prenočišča, kulinarika, vinski turizem in doživetja za vso družino.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "NaKmetiji" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@nakmetiji",
    creator: "@nakmetiji",
    title: "NaKmetiji — Odkrijte turistične kmetije v Sloveniji",
    description:
      "Najdite popolno turistično kmetijo za nepozaben oddih. Prenočišča, kulinarika, vinski turizem in doživetja za vso družino.",
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://nakmetiji.si",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sl"
      className={`${montserrat.variable} ${geistMono.variable} ${cormorant.variable} ${caveat.variable} h-full antialiased scroll-smooth`}
      data-scroll-behavior="smooth"
    >
      <head>
        <meta name="theme-color" content="#A8D5BA" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NaKmetiji" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground paper-grain">
        {/* Skip navigation — a11y for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:rounded-xl focus:bg-forest-700 focus:text-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg"
        >
          Preskoči na vsebino
        </a>
        {/* Demo mode banner — auto-hides in production (NEXT_PUBLIC_DEMO_MODE=false) */}
        <DemoBanner />
        <Navbar />
        <main id="main-content" className="flex-1 pb-20 md:pb-0">
          <Suspense fallback={null}>
            <PageTransition>{children}</PageTransition>
          </Suspense>
        </main>
        <Footer />
        {/* Demo mode footer strip */}
        <DemoFooterStrip />
        <OracleConcierge locale="sl" />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
