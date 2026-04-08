import type { Metadata } from "next";
import { MapPageClient } from "./MapPageClient";

export const metadata: Metadata = {
  title: "Zemljevid — Turistične kmetije v Sloveniji | NaKmetiji",
  description:
    "Interaktivni zemljevid turističnih kmetij po vsej Sloveniji. " +
    "Filtrirajte po regiji in doživetju ter odkrijte kmetije v vaši bližini.",
};

export default function ZemljevidPage() {
  return <MapPageClient />;
}
