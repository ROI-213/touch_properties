import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { useBrandSettings } from "@/hooks/useSiteSettings";
import { useCompareStore } from "@/hooks/useCompareStore";

export function WhatsAppButton() {
  const [hover, setHover] = useState(false);
  const { brand } = useBrandSettings();
  const hasCompare = useCompareStore((s) => s.ids.length > 0);
  const digits = (brand.whatsapp || brand.phone).replace(/\D/g, "");
  const href = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent("Hi, I'm interested in a property")}`
    : "#";
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`fixed right-4 md:right-6 z-[65] grid h-12 w-12 md:h-14 md:w-14 place-items-center rounded-full bg-whatsapp text-white shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation min-h-[48px] min-w-[48px] ${
        hasCompare ? "bottom-[152px] md:bottom-20" : "bottom-[80px] md:bottom-6"
      }`}
      style={{ animation: "pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite" }}
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-6 w-6 md:h-7 md:w-7" />
      {hover && (
        <span className="pointer-events-none absolute bottom-full right-0 mb-3 whitespace-nowrap rounded-full bg-charcoal px-3 py-1.5 text-xs text-ivory shadow-lg">
          Chat with us on WhatsApp
        </span>
      )}
    </a>
  );
}
