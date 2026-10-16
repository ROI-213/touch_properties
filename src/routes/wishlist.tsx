import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { useWishlistStore } from "@/hooks/useWishlist";
import { useDbProperties } from "@/hooks/useDbProperties";
import { properties as mockProperties } from "@/data/properties";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "My Saved Properties — Touch Stone Properties" },
      {
        name: "description",
        content: "View the properties you have saved to your wishlist.",
      },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const ids = useWishlistStore((s) => s.ids);
  const clear = useWishlistStore((s) => s.clear);
  const { data: dbProps = [] } = useDbProperties();

  // Combine DB + mock so saved IDs can resolve regardless of source.
  const byId = new Map<string, (typeof mockProperties)[number]>();
  [...dbProps, ...mockProperties].forEach((p) => {
    if (p?.id && !byId.has(p.id)) byId.set(p.id, p);
  });
  const saved = ids.map((id) => byId.get(id)).filter(Boolean) as typeof mockProperties;

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />

      <section className="mx-auto w-full px-4 sm:px-6 pb-24 pt-28 sm:pt-40">
        <div className="mb-8 sm:mb-10 text-center">
          <div className="mx-auto mb-4 sm:mb-5 h-px w-10 bg-gold" />
          <h1 className="font-display text-3xl font-bold text-charcoal sm:text-5xl">
            My Saved Properties
          </h1>
          {saved.length > 0 && (
            <p className="mt-3 text-sm text-charcoal/60">
              {saved.length} {saved.length === 1 ? "property" : "properties"} saved
              <button
                onClick={clear}
                className="ml-3 text-gold underline-offset-4 hover:underline"
              >
                Clear all
              </button>
            </p>
          )}
        </div>

        {saved.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-charcoal/10 bg-white p-8 sm:p-10 text-center shadow-card">
            <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-sand">
              <Heart size={36} className="text-gold" />
            </div>
            <h2 className="font-display text-2xl text-charcoal">
              You haven't saved any properties yet
            </h2>
            <p className="mt-2 text-sm text-charcoal/60">
              Tap the heart on any listing to save it here for later.
            </p>
            <Link
              to="/buy-properties/$type"
              params={{ type: "apartments" }}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-gold-light"
            >
              Browse Properties →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {saved.map((p, i) => (
              <PropertyCard key={p.id} p={p} index={i} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
