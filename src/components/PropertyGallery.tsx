import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Camera, X } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { FALLBACK_PROPERTY_IMAGE, resolveLocalImage } from "@/data/siteImages";

export function PropertyGallery({ images, title }: { images: string[]; title: string }) {
  const resolved = Array.isArray(images) && images.length > 0
    ? images.filter(Boolean).map((src) => resolveLocalImage(src, FALLBACK_PROPERTY_IMAGE))
    : [FALLBACK_PROPERTY_IMAGE];
  const safeImages = Array.from(new Set(resolved));
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };

  const prev = () => setIndex((i) => (i - 1 + safeImages.length) % safeImages.length);
  const next = () => setIndex((i) => (i + 1) % safeImages.length);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const thumbs = safeImages.slice(1, 5);

  return (
    <>
      {/* Mobile view */}
      <div className="relative overflow-hidden rounded-2xl md:hidden">
        {safeImages.length === 1 ? (
          <button onClick={() => openAt(0)} className="block h-[260px] sm:h-[320px] w-full">
            <img src={safeImages[0]} alt={title} className="h-full w-full object-cover" />
          </button>
        ) : (
          <Swiper modules={[Pagination]} pagination={{ clickable: true }} className="h-[260px] sm:h-[320px] w-full">
            {safeImages.map((src, i) => (
              <SwiperSlide key={i}>
                <button onClick={() => openAt(i)} className="block h-full w-full">
                  <img src={src} alt={`${title} ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
        <button
          type="button"
          onClick={() => openAt(0)}
          className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
        >
          <Camera size={13} /> {safeImages.length} {safeImages.length === 1 ? "Photo" : "Photos"}
        </button>
      </div>

      {/* Desktop view */}
      {safeImages.length === 1 ? (
        <div className="hidden md:block">
          <button
            onClick={() => openAt(0)}
            className="group relative block h-[520px] w-full overflow-hidden rounded-xl"
          >
            <img
              src={safeImages[0]}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </button>
        </div>
      ) : (
        <div className="hidden gap-3 md:grid md:grid-cols-[62%_1fr]">
          <button
            onClick={() => openAt(0)}
            className="group relative h-[520px] overflow-hidden rounded-xl"
          >
            <img
              src={safeImages[0]}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </button>
          <div
            className={`grid h-[520px] gap-3 ${
              thumbs.length === 1
                ? "grid-cols-1 grid-rows-1"
                : thumbs.length === 2
                  ? "grid-cols-1 grid-rows-2"
                  : "grid-cols-2 grid-rows-2"
            }`}
          >
            {thumbs.map((src, i) => {
              const isLast = i === thumbs.length - 1 && safeImages.length > 5;
              return (
                <button
                  key={i}
                  onClick={() => openAt(i + 1)}
                  className="group relative overflow-hidden rounded-xl"
                >
                  <img
                    src={src}
                    alt={`${title} ${i + 2}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {isLast && (
                    <div className="absolute inset-0 grid place-items-center bg-black/60 text-white">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Camera size={16} /> View All {safeImages.length} Photos
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex flex-col bg-[rgba(0,0,0,0.95)] p-4"
          >
            <div className="flex items-center justify-between text-ivory">
              <span style={{ fontFamily: "Space Mono, monospace" }} className="text-sm">
                {String(index + 1).padStart(2, "0")} / {String(safeImages.length).padStart(2, "0")}
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"
              >
                <X size={22} />
              </button>
            </div>

            <div className="relative flex flex-1 items-center justify-center">
              {safeImages.length > 1 && (
                <button
                  onClick={prev}
                  aria-label="Previous"
                  className="absolute left-2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/25 sm:left-6"
                >
                  <ChevronLeft size={26} />
                </button>
              )}
              <motion.img
                key={index}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                src={safeImages[index] ?? safeImages[0]}
                alt={`${title} ${index + 1}`}
                style={{ maxWidth: "90vw", maxHeight: "80vh" }}
                className="rounded-lg object-contain"
              />
              {safeImages.length > 1 && (
                <button
                  onClick={next}
                  aria-label="Next"
                  className="absolute right-2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/25 sm:right-6"
                >
                  <ChevronRight size={26} />
                </button>
              )}
            </div>

            {safeImages.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {safeImages.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border-2 transition ${
                      i === index ? "border-gold" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
