import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, GitCompare, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useCompareStore } from "@/hooks/useCompareStore";
import { useDbProperties } from "@/hooks/useDbProperties";
import { properties as staticProperties, type Property } from "@/data/properties";
import { CompareModal } from "@/components/CompareModal";
import { resolveLocalImage, FALLBACK_PROPERTY_IMAGE } from "@/data/siteImages";

export function CompareFloatingBar() {
  const ids = useCompareStore((s) => s.ids);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: dbProps = [] } = useDbProperties();

  const propertyMap = useMemo(() => {
    const list = dbProps.length > 0 ? dbProps : staticProperties;
    const map = new Map<string, Property>();
    for (const p of list) {
      if (p.id) map.set(p.id, p);
      if (p.slug) map.set(p.slug, p);
    }
    return map;
  }, [dbProps]);

  const compareProps = useMemo(() => {
    return ids
      .map((id) => propertyMap.get(id))
      .filter((p): p is Property => Boolean(p));
  }, [ids, propertyMap]);

  if (ids.length === 0) return null;

  const handleCompareClick = () => {
    if (compareProps.length < 2) {
      toast.error("Please select at least 2 properties to compare.");
      return;
    }
    setModalOpen(true);
  };

  return (
    <>
      <AnimatePresence>
        {ids.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed inset-x-0 bottom-16 md:bottom-0 z-[60] border-t border-gold/40 bg-charcoal/95 px-3 py-2.5 text-white shadow-[0_-10px_30px_rgba(0,0,0,0.3)] backdrop-blur-md sm:px-6"
          >
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
              <div className="flex items-center justify-between gap-2">
                {/* Left Label */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="grid h-7 w-7 sm:h-8 sm:w-8 shrink-0 place-items-center rounded-full bg-gold/20 text-gold">
                    <GitCompare size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] sm:text-xs font-bold text-gold uppercase tracking-wider truncate">
                      Compare ({compareProps.length}/4)
                    </div>
                    <div className="hidden sm:block text-[11px] text-white/70">
                      {compareProps.length} of 4 selected
                      {compareProps.length < 2 && " (Select 1 more to compare)"}
                    </div>
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex sm:hidden items-center gap-1.5 shrink-0">
                  <button
                    onClick={clear}
                    className="rounded-full border border-white/20 px-2.5 py-1 text-[11px] font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleCompareClick}
                    className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition shadow-md ${
                      compareProps.length >= 2
                        ? "bg-gradient-to-r from-gold to-gold-light text-charcoal shadow-gold/20"
                        : "bg-white/20 text-white/60 cursor-not-allowed"
                    }`}
                  >
                    <span>Compare</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>

              {/* Property Thumbnails */}
              <div className="flex flex-1 items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5 scrollbar-hide">
                {compareProps.map((p) => (
                  <div
                    key={p.id}
                    className="group relative flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-full border border-white/10 bg-white/10 py-1 pl-1 pr-2.5 text-[11px] sm:text-xs font-medium text-white backdrop-blur transition hover:border-gold/50"
                  >
                    <img
                      src={resolveLocalImage(p.image, FALLBACK_PROPERTY_IMAGE)}
                      alt={p.title}
                      className="h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover"
                    />
                    <span className="max-w-[100px] truncate sm:max-w-[160px]">{p.title}</span>
                    <button
                      onClick={() => remove(p.id)}
                      aria-label={`Remove ${p.title}`}
                      className="ml-0.5 rounded-full text-white/50 hover:bg-white/20 hover:text-white"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop Action Buttons */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={clear}
                  className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  Clear
                </button>

                <button
                  onClick={handleCompareClick}
                  className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition shadow-md ${
                    compareProps.length >= 2
                      ? "bg-gradient-to-r from-gold to-gold-light text-charcoal hover:scale-[1.02] shadow-gold/20"
                      : "bg-white/20 text-white/60 cursor-not-allowed"
                  }`}
                >
                  <span>Compare Now</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side by side comparison modal */}
      <CompareModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        properties={compareProps}
        onRemove={(id) => {
          remove(id);
          if (compareProps.length <= 2) {
            setModalOpen(false);
          }
        }}
      />
    </>
  );
}
