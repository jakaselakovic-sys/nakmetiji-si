// =============================================================================
// NaKmetiji.si — Root Layout
// =============================================================================

import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
  weight: ["700", "800", "900"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#1a3a2a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NaKmetiji" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-full flex flex-col bg-cream text-forest-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
