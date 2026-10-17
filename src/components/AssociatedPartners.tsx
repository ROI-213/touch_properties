import { useMemo } from "react";
import sobhaLogo from "@/assets/images/partners/sobha.png";
import rankaLogo from "@/assets/images/partners/ranka.png";
import prestigeLogo from "@/assets/images/partners/prestige.png";
import brigadeLogo from "@/assets/images/partners/brigade.png";
import embassyLogo from "@/assets/images/partners/embassy.png";
import snnLogo from "@/assets/images/partners/snn.png";
import puravankaraLogo from "@/assets/images/partners/puravankara.png";
import providentLogo from "@/assets/images/partners/provident.png";
import godrejLogo from "@/assets/images/partners/godrej.png";
import salarpuriaLogo from "@/assets/images/partners/salarpuria-sattva.png";
import lodhaLogo from "@/assets/images/partners/lodha.png";
import casaGrandeLogo from "@/assets/images/partners/casa-grande.png";
import { usePartners, usePartnersSection } from "@/hooks/useSiteSettings";
import { resolveLocalImage } from "@/data/siteImages";

type Partner = { name: string; logo: string };

const FALLBACK: Partner[] = [
  { name: "Brigade Group", logo: brigadeLogo },
  { name: "Embassy Group", logo: embassyLogo },
  { name: "Sumadhura", logo: snnLogo },
  { name: "Sobha", logo: sobhaLogo },
  { name: "RKA", logo: rankaLogo },
  { name: "Prestige Group", logo: prestigeLogo },
  { name: "Provident", logo: providentLogo },
  { name: "Godrej Properties", logo: godrejLogo },
  { name: "Casa Grande", logo: casaGrandeLogo },
  { name: "Lodha", logo: lodhaLogo },
  { name: "Salarpuria Sattva", logo: salarpuriaLogo },
  { name: "Puravankara", logo: puravankaraLogo },
];

function LogoCard({ name, logo }: Partner) {
  return (
    <div className="mx-3 flex h-[110px] w-[150px] shrink-0 items-center justify-center rounded-2xl border border-[#E5EAF0] bg-white px-4 transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(15,31,68,0.10)] md:h-[135px] md:w-[170px] md:px-5">
      <img src={logo} alt={name} loading="lazy" className="max-h-[70%] max-w-[80%] object-contain" />
    </div>
  );
}

function MarqueeRow({ partners, direction }: { partners: Partner[]; direction: "left" | "right" }) {
  const animation =
    direction === "left" ? "ap-marquee-left 40s linear infinite" : "ap-marquee-right 40s linear infinite";
  return (
    <div className="group/row flex overflow-hidden">
      <div className="flex shrink-0 group-hover/row:[animation-play-state:paused]" style={{ animation }}>
        {partners.map((p, i) => <LogoCard key={`a-${i}-${p.name}`} {...p} />)}
      </div>
      <div aria-hidden="true" className="flex shrink-0 group-hover/row:[animation-play-state:paused]" style={{ animation }}>
        {partners.map((p, i) => <LogoCard key={`b-${i}-${p.name}`} {...p} />)}
      </div>
    </div>
  );
}

export function AssociatedPartners() {
  const { items } = usePartners(true);
  const { section } = usePartnersSection();
  const partners = useMemo<Partner[]>(() => {
    const mapped = items
      .filter((p) => p.logo_url)
      .map((p) => ({ name: p.name, logo: resolveLocalImage(p.logo_url, "") }));
    // Use bundled fallback logos while DB is loading or empty so the section
    // is visible on the very first render (SSR + hydration) without a flash.
    return mapped.length > 0 ? mapped : FALLBACK;
  }, [items]);

  if (section.is_section_active === false) return null;

  const safe = partners;
  const half = Math.ceil(safe.length / 2);
  const rowOne = safe.slice(0, half);
  const rowTwo = safe.slice(half);


  return (
    <section className="relative w-full bg-[#FBF8F2] py-6 md:py-8" id="associated-partners" aria-label="Associated Partners">
      <div className="w-full px-2 sm:px-4 md:px-6">
        <div className="w-full rounded-[24px] sm:rounded-[28px] border border-[#E5EAF0] bg-white px-4 py-8 shadow-[0_18px_50px_rgba(15,31,68,0.06)] sm:px-8 md:px-12 md:py-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[3px] text-[#C8A34D]">
              <span className="h-px w-8 bg-[#C8A34D]" />
              {section.small_label}
              <span className="h-px w-8 bg-[#C8A34D]" />
            </span>
            <h2 className="mt-4 text-3xl font-bold text-[#0F1F44] md:text-[40px]" style={{ fontFamily: "'Playfair Display', serif" }}>
              {section.heading}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-relaxed text-[#0F1F44]/65 md:text-[15px]">
              {section.subtitle}
            </p>
          </div>

          <div className="relative mt-10 md:mt-12">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent md:w-24" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent md:w-24" />
            <div className="space-y-5 md:space-y-6">
              <MarqueeRow partners={rowOne} direction="left" />
              {rowTwo.length > 0 && <MarqueeRow partners={rowTwo} direction="right" />}
            </div>
          </div>

          {section.bottom_quote && (
            <p className="mx-auto mt-10 max-w-3xl text-center text-[13px] italic leading-relaxed text-[#0F1F44]/60 md:mt-12 md:text-[14px]">
              “{section.bottom_quote}”
            </p>
          )}
        </div>
      </div>


      <style>{`
        @keyframes ap-marquee-left { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
        @keyframes ap-marquee-right { 0% { transform: translateX(-100%); } 100% { transform: translateX(0); } }
      `}</style>
    </section>
  );
}

export default AssociatedPartners;
