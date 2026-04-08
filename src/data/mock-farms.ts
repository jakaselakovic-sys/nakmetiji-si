import { Farm, Region } from "@/types/farm";

/**
 * Mock data for development and testing.
 * These represent realistic Slovenian tourist farm listings.
 */
export const MOCK_FARMS: Farm[] = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    slug: "kmetija-pri-janezu",
    name: "Kmetija pri Janežu",
    description:
      "Družinska turistična kmetija v srcu Gorenjske z razgledom na Julijske Alpe. " +
      "Ponujamo domačo hrano iz lastne pridelave, prenočišča v lesenih hišicah in " +
      "edinstveno doživetje podeželskega življenja. Naši gostje lahko pomagajo pri " +
      "krmljenju živali, nabiranju zelišč ali se odpravijo na vodene pohodne ture.\n\n" +
      "Kmetija stoji na sončni legi nad dolino, obkrožena s cvetočimi travniki in " +
      "starodavnimi sadovnjaki. Tu se čas ustavi — jutranje budnice so petje ptic, " +
      "večerne pa žuborenje bližnjega potoka. Naša filozofija je preprosta: pristna " +
      "gostoljubnost, sveža hrana in spoštovanje narave.\n\n" +
      "Za najmlajše imamo mini živalski vrt s kozami, zajci, kokoši in ponimi. " +
      "Starejši otroci se lahko preizkusijo v jahanju ali ustvarjalnih delavnicah. " +
      "Odrasli pa uživajo v degustacijah domačih sirov, marmelad in žganih pijač.",
    tagline: "Okusi pristne Gorenjske v objemu Alp",
    region: Region.Gorenjska,
    address: "Zgornja Lipnica 42",
    municipality: "Radovljica",
    postalCode: "4244",
    location: { latitude: 46.3442, longitude: 14.1729 },
    coverImageUrl: "/images/farms/kmetija-janezu.png",
    galleryImageUrls: [
      "/images/farms/gallery-kulinarika.png",
      "/images/farms/gallery-zivali.png",
      "/images/farms/gallery-prenocisce.png",
    ],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    experiencesOffered: ["prenocisce", "kulinarika", "druzine", "zivali"],
    rating: 4.8,
    reviewCount: 127,
    isPremium: true,
    isActive: true,
    contact: {
      phone: "+386 4 532 1100",
      email: "info@kmetija-janezu.si",
      website: "https://kmetija-janezu.si",
      instagram: "@kmetijajanezu",
    },
    createdAt: "2025-06-15T10:00:00Z",
    updatedAt: "2026-03-01T14:30:00Z",
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    slug: "vinska-klet-brda",
    name: "Vinska klet Brda",
    description:
      "Tradicionalna vinska klet v Goriških Brdih s panoramskim razgledom na vinograde. " +
      "Specializirani smo za rebulo, malvazijo in merlot. Organiziramo degustacije, " +
      "poroke v vinogradu in kulinarične delavnice s poudarkom na primorski kuhinji.\n\n" +
      "Naša družina se z vinogradništvom ukvarja že pet generacij. Vsaka steklenica " +
      "pripoveduje zgodbo o soncu, vetru in skrbnih rokah, ki negujejo trto od " +
      "pomladi do trgatve. Vabljeni, da to zgodbo odkrijete skupaj z nami.",
    tagline: "Kjer se sonce sreča z vinsko trto",
    region: Region.Primorska,
    address: "Šmartno 18",
    municipality: "Brda",
    postalCode: "5212",
    location: { latitude: 45.9747, longitude: 13.5311 },
    coverImageUrl: "/images/farms/vinska-klet-brda.png",
    galleryImageUrls: [
      "/images/farms/gallery-kulinarika.png",
      "/images/farms/gallery-prenocisce.png",
    ],
    videoUrl: undefined,
    experiencesOffered: ["vino", "kulinarika", "prireditve", "delavnice"],
    rating: 4.9,
    reviewCount: 203,
    isPremium: true,
    isActive: true,
    contact: {
      phone: "+386 5 395 2200",
      email: "degustacija@vinskaklet-brda.si",
      website: "https://vinskaklet-brda.si",
      instagram: "@vinskakletbrda",
      facebook: "VinaKletBrda",
    },
    createdAt: "2025-03-20T08:00:00Z",
    updatedAt: "2026-02-15T09:45:00Z",
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    slug: "eko-kmetija-drevc",
    name: "Eko kmetija Drevce",
    description:
      "Certificirana ekološka kmetija na Štajerskem, ki se ukvarja s pridelavo " +
      "ekološkega sadja, zelenjave in domačih mlečnih izdelkov. Nudimo wellness " +
      "z naravnimi preparati, jogo na prostem in delavnice trajnostnega kmetovanja.\n\n" +
      "Verjamemo, da je narava najboljši zdravilec. Naši wellness programi temeljijo " +
      "na zeliščih, ki jih gojimo na lastnem vrtu — sivka, meta, kamilica in " +
      "bezeg. Po jutranji jogi na prostem vas čaka zajtrk iz svežih jajc, " +
      "domačega kruha in sadja, nabranega tisto jutro.",
    tagline: "Naravno. Ekološko. Po domače.",
    region: Region.Stajerska,
    address: "Spodnji Gabrnik 7",
    municipality: "Slovenske Konjice",
    postalCode: "3210",
    location: { latitude: 46.3369, longitude: 15.4258 },
    coverImageUrl: "/images/farms/eko-kmetija-drevc.png",
    galleryImageUrls: [
      "/images/farms/gallery-zivali.png",
    ],
    videoUrl: "https://vimeo.com/123456789",
    experiencesOffered: ["ekologija", "wellness", "delavnice", "kulinarika"],
    rating: 4.6,
    reviewCount: 58,
    isPremium: false,
    isMedium: true,
    isActive: true,
    contact: {
      email: "eko@kmetija-drevc.si",
      website: "https://kmetija-drevc.si",
    },
    createdAt: "2025-09-01T12:00:00Z",
    updatedAt: "2026-01-10T16:20:00Z",
  },
  {
    id: "d4e5f6a7-b8c9-0123-defa-234567890123",
    slug: "ranc-bela-krajina",
    name: "Ranč Bela Krajina",
    description:
      "Konjerejski ranč v čudoviti Beli Krajini z možnostjo jahanja za začetnike " +
      "in izkušene jezdece. Idealno za družinske izlete z otroki — ponujamo tudi " +
      "mini živalski vrt, trampolinpark in domačo gostilno z belokranjskimi jedmi.\n\n" +
      "Na našem ranču vsak dan prinaša novo avanturo. Jahalni izleti po gozdnih " +
      "poteh, opazovanje ptic ob reki Krki, ali preprosto uživanje v miru " +
      "belokranjske pokrajine. Za pogumnejše organiziramo tudi nočne izlete.",
    tagline: "Avantura za celo družino",
    region: Region.Dolenjska,
    address: "Podzemelj 33",
    municipality: "Semič",
    postalCode: "8340",
    location: { latitude: 45.6333, longitude: 15.1833 },
    coverImageUrl: "/images/farms/kmetija-janezu.png",
    galleryImageUrls: [
      "/images/farms/gallery-zivali.png",
      "/images/farms/gallery-kulinarika.png",
    ],
    videoUrl: undefined,
    experiencesOffered: ["sport", "druzine", "zivali", "kulinarika"],
    rating: 4.5,
    reviewCount: 89,
    isPremium: false,
    isMedium: true,
    isActive: true,
    contact: {
      phone: "+386 7 356 7800",
      email: "info@ranc-belakrajina.si",
      facebook: "RancBelaKrajina",
    },
    createdAt: "2025-11-10T09:30:00Z",
    updatedAt: "2026-03-20T11:00:00Z",
  },
  {
    id: "e5f6a7b8-c9d0-1234-efab-345678901234",
    slug: "tourist-farm-pomurje",
    name: "Turistična kmetija Pomurje",
    description:
      "Termalna oaza sredi panonske nižine. Poleg klasičnega kmečkega turizma " +
      "ponujamo dostop do naravnega termalnega vrelca, savno in masaže. " +
      "Naša kuhinja sloni na prekmurski kuhinji — bujta repa, prekmurska gibanica " +
      "in domači bograč so naše specialitete.\n\n" +
      "Pomurska ravnica je polna presenečenj — od termalne vode do bogatih " +
      "vinogradov. Pri nas boste odkrili drugačno plat Slovenije, polno toplote, " +
      "pristne gostoljubnosti in okusov, ki jih ne boste pozabili.",
    tagline: "Toplota Prekmurja na dlani",
    region: Region.Pomurska,
    address: "Lendavska cesta 88",
    municipality: "Moravske Toplice",
    postalCode: "9226",
    location: { latitude: 46.6833, longitude: 16.2167 },
    coverImageUrl: "/images/farms/eko-kmetija-drevc.png",
    galleryImageUrls: [
      "/images/farms/gallery-prenocisce.png",
    ],
    videoUrl: undefined,
    experiencesOffered: ["wellness", "kulinarika", "prenocisce"],
    rating: 4.7,
    reviewCount: 145,
    isPremium: true,
    isActive: true,
    contact: {
      phone: "+386 2 538 1500",
      email: "rezervacije@tk-pomurje.si",
      website: "https://tk-pomurje.si",
    },
    createdAt: "2025-04-05T07:00:00Z",
    updatedAt: "2026-03-25T08:15:00Z",
  },
];
