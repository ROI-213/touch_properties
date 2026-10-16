import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useFaqs } from "@/hooks/useSiteSettings";

export const Route = createFileRoute("/faqs")({
  head: () => ({
    meta: [
      { title: "FAQs — Touch Stone Properties" },
      { name: "description", content: "Answers to common questions about buying, selling and renting properties in Bangalore." },
      { property: "og:title", content: "FAQs — Touch Stone Properties" },
      { property: "og:description", content: "Answers to common questions about buying, selling and renting properties in Bangalore." },
    ],
  }),
  component: FaqsPage,
});

function FaqsPage() {
  const { items, isLoading } = useFaqs(true);
  const [open, setOpen] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string>("All");

  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    items.forEach((i) => set.add(i.category || "General"));
    return Array.from(set);
  }, [items]);

  const filtered = activeCat === "All" ? items : items.filter((i) => (i.category || "General") === activeCat);

  return (
    <>
      <Navbar />
      <main className="bg-gradient-to-b from-[#faf6ee] via-white to-[#faf6ee] pb-24 pt-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs tracking-[0.4em] text-[#c9a961] font-medium">— FREQUENTLY ASKED</span>
            <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-bold text-[#0a1f44] md:text-5xl">
              Got a question? <span className="italic text-[#c9a961]">We've got answers.</span>
            </h1>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-600">
              Everything you need to know about buying, selling, renting and working with Touch Stone Properties.
            </p>
          </div>

          {categories.length > 1 && (
            <div className="mt-7 sm:mt-8 flex flex-wrap justify-center gap-2">
              {categories.map((c) => (
                <button key={c} onClick={() => setActiveCat(c)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                    activeCat === c ? "bg-[#0a1f44] text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 sm:mt-10 space-y-3">
            {isLoading && <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-500">Loading…</div>}
            {!isLoading && filtered.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                <HelpCircle className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                No FAQs in this category yet.
              </div>
            )}
            {filtered.map((f) => {
              const isOpen = open === f.id;
              return (
                <div key={f.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <button onClick={() => setOpen(isOpen ? null : f.id)}
                    className="flex w-full items-center justify-between gap-3 sm:gap-4 px-4 py-3.5 sm:px-5 sm:py-4 text-left transition hover:bg-slate-50">
                    <span className="text-sm sm:text-base font-semibold text-[#0a1f44]">{f.question}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-[#c9a961] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <p className="whitespace-pre-line border-t border-slate-100 px-4 py-3.5 sm:px-5 sm:py-4 text-sm leading-relaxed text-slate-600">
                          {f.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
