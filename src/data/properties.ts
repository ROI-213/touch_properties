export interface Property {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  builder: string;
  ownerName?: string;
  location: string;
  area: string; // zone / area like "Whitefield"
  city: string;
  type: "Apartment" | "Villa" | "Plot" | "Commercial" | "Residential";
  listingType: "BUY" | "RENT";
  price: string;
  priceValue: number; // in INR
  bhk: number;
  baths: number;
  sqft: number;
  description: string;
  image: string;
  possession?: "Ready to Move" | "Under Construction";
  furnishing?: "Furnished" | "Semi-Furnished" | "Unfurnished";
  featured?: boolean;
  premium?: boolean;
  trending?: boolean;
  sold?: boolean;
  rented?: boolean;
  rera?: boolean;
  createdAt?: string;
  views?: number;
  isTopFeatured?: boolean;
  topFeaturedRank?: number | null;
}

import { siteImages, initialsAvatar } from "./siteImages";

const P = siteImages.properties;
const IMG = {
  apt1: P.manyataApartment,
  apt2: P.sarjapurTower,
  apt3: P.indiranagarApartment,
  apt4: P.jpnagarApartment,
  apt5: P.luxuryInterior,
  villa1: P.whitefieldVilla,
  villa2: P.yelahankaVilla,
  villa3: P.electronicCityGated,
  plot1: P.kanakapuraPlot,
  plot2: P.northBangaloreTownship,
  comm1: P.bangaloreCommercial,
  comm2: P.bangaloreCommercial,
};

export const properties: Property[] = [
  {
    id: "c00825bb-b456-4c33-96b8-a5c74f6a14e8",
    slug: "dsr-parkway-2-5-bhk",
    title: "DSR parkway 2.5 bhk",
    builder: "Touchstone Properties",
    location: "DSR Parkway, Bellandur, Bengaluru",
    area: "Sarjapur Road",
    city: "Bangalore",
    type: "Apartment",
    listingType: "BUY",
    price: "₹ 2.2 Cr onwards",
    priceValue: 22000000,
    bhk: 3,
    baths: 2,
    sqft: 1528,
    description:
      "FOR SALE | PREMIUM 3 BHK APARTMENT at DSR Parkway, Bellandur, Bengaluru. Spacious semi-furnished home with 2 covered car parks, 1,528 Sq. Ft. Super Built-up Area on the 7th floor.",
    image: "/api/storage/property-media/properties/1792057558679-xj2b7y.jpeg",
    possession: "Ready to Move",
    furnishing: "Semi-Furnished",
    featured: true,
    premium: true,
    trending: true,
    createdAt: "2026-10-15T09:05:04.487Z",
    views: 1500,
  },
  {
    id: "efb25f01-d9e2-4cb3-a9b5-ec009cb9665c",
    slug: "for-sale-premium-4-bhk-servant-room-salarpuria-sattva-greenage",
    title: "FOR SALE | PREMIUM 4 BHK + SERVANT ROOM Salarpuria Sattva Greenage",
    builder: "SALARPURIA SATTVA",
    location: "Salarpuria Sattva Greenage, Hosur Main Road, Bengaluru",
    area: "Hosa Road",
    city: "Bangalore",
    type: "Apartment",
    listingType: "BUY",
    price: "₹ 6.55 Cr onwards",
    priceValue: 65500000,
    bhk: 4,
    baths: 4,
    sqft: 2800,
    description:
      "Premium, fully furnished park-facing 4 BHK + Servant Room residence at Salarpuria Sattva Greenage, Hosur Main Road, Bommanahalli, Bengaluru. 2,800 Sq. Ft. SBUA.",
    image: "/api/storage/property-media/properties/1789804135836-u06zjf.jpeg",
    possession: "Ready to Move",
    furnishing: "Furnished",
    featured: true,
    premium: true,
    trending: true,
    createdAt: "2026-09-19T07:49:01.485Z",
    views: 1750,
  },
  {
    id: "3a9441eb-4f60-498b-8cf2-6197f7246feb",
    slug: "adarsh-palm-retreat-condominiums-phase-3",
    title: "Adarsh Palm retreat Condominiums Phase-3",
    builder: "Adarsh Developers",
    location: "Adarsh Palm Retreat Condominiums Phase-3, Outer Ring Road, Bellandur",
    area: "Sarjapur Road",
    city: "Bangalore",
    type: "Apartment",
    listingType: "BUY",
    price: "₹ 2.95 Cr onwards",
    priceValue: 29500000,
    bhk: 2,
    baths: 2,
    sqft: 1350,
    description:
      "Well-maintained 2 BHK semi-furnished apartment at Adarsh Palm Retreat Condominiums Phase 3 (Daffodils Tower-3), Outer Ring Road, Bellandur, Bengaluru.",
    image: "/api/storage/property-media/properties/1789234942448-qytciw.jpg",
    possession: "Ready to Move",
    furnishing: "Semi-Furnished",
    featured: true,
    premium: true,
    trending: true,
    createdAt: "2026-09-12T17:38:29.580Z",
    views: 1620,
  },
  {
    id: "5a9cc877-4390-47a1-8af4-2f3ee3cf55d2",
    slug: "prestige-aspin-greens",
    title: "Prestige Aspin Greens",
    builder: "Prestige Group",
    location: "Sarjapur Road, Bangalore",
    area: "Sarjapur Road",
    city: "Bangalore",
    type: "Villa",
    listingType: "RENT",
    price: "₹ 1.65 L onwards",
    priceValue: 165000,
    bhk: 4,
    baths: 6,
    sqft: 5400,
    description:
      "Premium 4 BHK villa at Prestige Aspen Greens with all modern facilities and amenities. 5,400 Sq. Ft. SBUA, East facing, semi-furnished.",
    image: "/api/storage/property-media/properties/1789051880877-aq4f5c.jpeg",
    possession: "Ready to Move",
    furnishing: "Semi-Furnished",
    featured: true,
    premium: true,
    trending: true,
    createdAt: "2026-09-10T14:45:06.915Z",
    views: 1580,
  },
  {
    id: "6f24b89c-8b5a-4606-8348-d756ad0a6fab",
    slug: "sobha-royal-pavilion",
    title: "Sobha Royal Pavilion",
    builder: "SOBHA DEVELOPERS",
    location: "Sarjapur - Marathahalli Rd, Carmelaram, Hadosiddapura, Bengaluru",
    area: "Sarjapur Road",
    city: "Bangalore",
    type: "Apartment",
    listingType: "BUY",
    price: "₹ 4.15 Cr onwards",
    priceValue: 41500000,
    bhk: 4,
    baths: 3,
    sqft: 2232,
    description:
      "Luxury 4 BHK apartment at Sobha Royal Pavilion, Sarjapur Road. 2,232 Sq. Ft. SBUA, semi-furnished, higher floor with 16,000 Sq. Ft. clubhouse.",
    image: P.sarjapurTower,
    possession: "Ready to Move",
    furnishing: "Semi-Furnished",
    featured: true,
    premium: true,
    trending: true,
    createdAt: "2026-09-03T07:01:43.678Z",
    views: 1920,
  },
  {
    id: "3535fa5e-0c5c-44f3-bf69-bca1be602d13",
    slug: "2bhkk-dsr-parkway-carmelram",
    title: "2BHK DSR Parkway Carmelram",
    builder: "Touchstone Properties",
    location: "Carmelaram, Off Sarjapur Road, Bengaluru",
    area: "Sarjapur Road",
    city: "Bangalore",
    type: "Apartment",
    listingType: "BUY",
    price: "₹ 1.75 Cr onwards",
    priceValue: 17500000,
    bhk: 2,
    baths: 2,
    sqft: 1303,
    description:
      "Premium 2 BHK East-facing apartment at DSR Parkway, Carmelaram, Off Sarjapur Road, Bengaluru. 1,303 Sq. Ft. SBUA on the 10th floor.",
    image: P.manyataApartment,
    possession: "Ready to Move",
    furnishing: "Semi-Furnished",
    featured: true,
    premium: true,
    trending: true,
    createdAt: "2026-07-18T12:42:20.587Z",
    views: 1490,
  },
  {
    id: "TSP-1019", slug: "sumadhura-epitome-rachenahalli",
    title: "Sumadhura Epitome", builder: "Sumadhura Group",
    location: "Rachenahalli Main Road, near Manyata Tech Park, Bangalore",
    area: "Hebbal", city: "Bangalore",
    type: "Apartment", listingType: "BUY",
    price: "₹ 1.36 Cr onwards", priceValue: 13600000,
    bhk: 3, baths: 3, sqft: 1805,
    description: "Mediterranean-themed luxury residences on 7 acres with 3 G+14 towers, moments from Manyata Tech Park. Phase 1 now launched — 2, 2.5, 3 & 4 BHK premium homes.",
    image: P.sumadhuraEpitome,
    possession: "Under Construction", furnishing: "Semi-Furnished",
    featured: true, premium: true, trending: true,
    createdAt: "2026-06-16", views: 2100,
  },
  {
    id: "TSP-1020", slug: "sumadhura-panorama-devanahalli-plot",
    title: "Plot Sale in Sumadhura Panorama - Devanahalli",
    builder: "Sumadhura Group",
    location: "Devanahalli Road, Bengaluru",
    area: "Devanahalli", city: "Bangalore",
    type: "Plot", listingType: "BUY",
    price: "₹ 75 L onwards", priceValue: 7500000,
    bhk: 0, baths: 0, sqft: 1200,
    description: "Premium plotted development on 100 acres — Phase 1 with 539 plots (30×40 to 40×60+). 6 km from BIAL Airport. Clubhouse 45,000 sq.ft., 9 acres of green spaces.",
    image: P.sumadhuraPanorama,
    possession: "Ready to Move",
    featured: true, premium: true, trending: true,
    createdAt: "2026-06-16", views: 1850,
  },
  {
    id: "TSP-1021", slug: "sarang-by-sumadhura-whitefield",
    title: "Sarang by Sumadhura", builder: "Sumadhura Group",
    location: "Doddabanahalli, Whitefield, Bengaluru",
    area: "Whitefield", city: "Bangalore",
    type: "Apartment", listingType: "BUY",
    price: "₹ On Request", priceValue: 0,
    bhk: 3, baths: 3, sqft: 1740,
    description: "Premium 3 & 4 BHK apartments on 4.26 acres in Doddabanahalli, Whitefield. 3 towers (A, B, C) · 410 units · 2B+G+22 floors. No common walls, biophilic design, 33,000 sq.ft. clubhouse, 30+ amenities and 75% open spaces. Phase 01 possession Dec 2026 · Phase 02 June 2027.",
    image: P.sarangBySumadhura,
    possession: "Under Construction",
    featured: true, premium: true, trending: true,
    createdAt: "2026-06-16", views: 2400,
  },
  {
    id: "TSP-1022", slug: "sumadhura-capitol-residences-bangalore",
    title: "Sumadhura Capitol Residences", builder: "Sumadhura Group",
    location: "Bengaluru",
    area: "Bangalore", city: "Bangalore",
    type: "Apartment", listingType: "BUY",
    price: "₹ 3.15 Cr onwards", priceValue: 31500000,
    bhk: 4, baths: 4, sqft: 2115,
    description: "Premium 3 & 4 BHK residences across 4.1 acres — 4 towers, 368 units, 3B+G+15 floors. East, West & South-facing balconies, world-class amenities and top-notch specifications. Launching Tower D: Luxury 4 BHK 2115 sq.ft. starting ₹3.15 Cr*. 3 BHK Smart 1635–1655 sq.ft. · 3 BHK Classic 1810–1860 sq.ft. · 4 BHK 2100–2115 sq.ft.",
    image: P.sumadhuraCapitolResidences,
    possession: "Under Construction",
    featured: true, premium: true, trending: true,
    createdAt: "2026-06-16", views: 2600,
  },
  {
    id: "TSP-1023", slug: "godrej-lakeside-orchard-sarjapur-road",
    title: "Godrej Lakeside Orchard", builder: "Godrej Properties",
    location: "Sarjapur Road, Bangalore",
    area: "Sarjapur Road", city: "Bangalore",
    type: "Apartment", listingType: "BUY",
    price: "₹ 1.8 Cr onwards", priceValue: 18000000,
    bhk: 3, baths: 3, sqft: 1509,
    description: "Serene lakeside living on Sarjapur Road — 15.9 acres, G+25 towers, 600+ apartments designed for 875 families. 75% open spaces, 15 acres of lakeside living, 6 acres greenery and 700+ trees. 47,000 sq.ft. luxurious clubhouse. Exclusive 3, 3.5 & 4 BHK homes. 3 BHK+2T (1509–1580) from ₹1.8 Cr · 3 BHK+3T (1760–1997) from ₹1.95 Cr · 3.5 BHK (2160–2250) from ₹2.5 Cr · 4 BHK + Studio (2660) from ₹3.2 Cr. 25x4 payment plan on limited units. Possession 2028. Contact Martine · 9902925519.",
    image: P.godrejLakesideOrchard,
    possession: "Under Construction",
    featured: true, premium: true, trending: true,
    createdAt: "2026-06-16", views: 2800,
  },
  {
    id: "TSP-1024", slug: "sumadhura-folium-whitefield",
    title: "Sumadhura Folium Whitefield", builder: "Sumadhura Group",
    location: "Whitefield, Bengaluru",
    area: "Whitefield", city: "Bangalore",
    type: "Apartment", listingType: "BUY",
    price: "₹ On Request", priceValue: 0,
    bhk: 3, baths: 3, sqft: 1615,
    description: "Premium 3 & 4 BHK residences on a 16.5-acre land parcel in Whitefield. 54,000 sq.ft. clubhouse, 84% open space, 100+ amenities, 500+ trees, lagoon pool, central park and co-working / conference space. Phase 2 — 3 BHK Smart 1615 · 3 BHK Classic 1720 · 4 BHK Smart 1895 · 4 BHK Classic · 4 BHK Grand with Maid Room. Phase 3 — 3 BHK Smart 1615 · 3 BHK Classic 1745 · 4 BHK Smart 1895–2015 · 4 BHK Grand 2465–2560. Nearby: Nallurhalli Metro 10 min · Channasandra Metro 10 min · Manipal Hospital 5 min · ITPL 10 min · Sumadhura Capitol Towers 10 min · Narayana School 2 min.",
    image: P.sumadhuraFoliumWhitefield,
    possession: "Under Construction",
    featured: true, premium: true, trending: true,
    createdAt: "2026-06-16", views: 2700,
  },
  {
    id: "TSP-1025", slug: "arvind-great-lands-devanahalli",
    title: "Arvind Great Lands / Arvind The Park", builder: "Arvind SmartSpaces",
    location: "Off IVC Road, Near DC Office, Devanahalli, North Bengaluru",
    area: "Devanahalli", city: "Bangalore",
    type: "Plot", listingType: "BUY",
    price: "₹ 78 L onwards", priceValue: 7800000,
    bhk: 0, baths: 0, sqft: 1200,
    description: "Luxury villa plots on a 75+ acre land parcel with 600+ villa plots near IVC Road, DC Office, Devanahalli — North Bengaluru. Golf-course lifestyle ambience, private garden living, large green landscape and multiple amenities. Special offer: Rs. 6,500/- per sq.ft. all-inclusive. Villa plots starting ₹78L+. RERA: PRM/KA/RERA/1250/303/PR/050325/007549. Contact 9902925519.",
    image: P.arvindGreatLands,
    possession: "Ready to Move",
    featured: true, premium: true, trending: true,
    createdAt: "2026-06-16", views: 2200,
  },
  {
    id: "TSP-1026", slug: "lodha-hosa-road-pre-launch",
    title: "Lodha Hosa Road — Pre-Launch", builder: "Lodha",
    location: "Hosa Road, HSR Extension, South East Bangalore",
    area: "Hosa Road", city: "Bangalore",
    type: "Apartment", listingType: "BUY",
    price: "₹ 2.3 Cr onwards", priceValue: 23000000,
    bhk: 3, baths: 3, sqft: 1050,
    description: "Exclusive pre-launch alert from Lodha — India's No. 1 developer. Forest-themed ultra-luxury residences in Green Living, Hosa Road, HSR Extension, South East Bangalore. Spacious 3 BHK, 3.5 BHK & 4 BHK flats with expansive decks and breathtaking lake views. Seamlessly connected to ORR, Electronic City, Silk Board and Sarjapur Road — minutes from top schools, major IT hubs and metro. Configurations: 3 BHK 1050–1100 sq.ft. from ₹2.3 Cr · 3.5 BHK 1300–1400 sq.ft. from ₹2.9 Cr · 3.5 BHK Luxe 1550–1650 sq.ft. from ₹3.46 Cr · 4 BHK 2150–2250 sq.ft. from ₹4.8 Cr. Contact 9902925519.",
    image: P.lodhaHosaRoad,
    possession: "Under Construction",
    featured: true, premium: true, trending: true,
    createdAt: "2026-06-16", views: 1900,
  },
];





export const testimonials = [
  {
    name: "Aarav Mehta",
    role: "Founder, Mehta Capital · Whitefield",
    avatar: initialsAvatar("Aarav Mehta"),
    quote: "Touch Stone curated three properties that matched our brief perfectly. We closed in 11 days. Refreshingly transparent and zero pressure.",
  },
  {
    name: "Priya Raghavan",
    role: "NRI Investor · Koramangala",
    avatar: initialsAvatar("Priya Raghavan", "1c1c1e"),
    quote: "From Dubai I needed someone I could trust completely. They handled legal, registration and even interior handover. White-glove service.",
  },
  {
    name: "Vikram Iyer",
    role: "CTO · HSR Layout",
    avatar: initialsAvatar("Vikram Iyer", "4a5e52"),
    quote: "The market intel was extraordinary — they showed us comparables, builder track records, RERA filings. Made a complicated decision feel obvious.",
  },
  {
    name: "Ananya Krishnan",
    role: "Doctor · Indiranagar",
    avatar: initialsAvatar("Ananya Krishnan", "8b2635"),
    quote: "Our family villa search took two years with other brokers. Touch Stone narrowed it to four homes that all fit. We loved one of them.",
  },
  {
    name: "Rohit Bhat",
    role: "Entrepreneur · Devanahalli",
    avatar: initialsAvatar("Rohit Bhat"),
    quote: "Premium service without the premium pretence. They genuinely cared about getting the right home, not the biggest commission.",
  },
];
