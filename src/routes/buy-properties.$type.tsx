import { createFileRoute } from "@tanstack/react-router";
import { ListingPage } from "@/components/ListingPage";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const Route = createFileRoute("/buy-properties/$type")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => {
    const q = typeof search.q === "string" ? search.q : "";
    return q ? { q } : {};
  },
  head: ({ params }) => ({
    meta: [
      { title: `Buy ${cap(params.type)} in Bangalore — Touch Stone Properties` },
      {
        name: "description",
        content: `Verified ${params.type} for sale in Bangalore. RERA-compliant, curated listings.`,
      },
    ],
  }),
  component: BuyPage,
});


function BuyPage() {
  const { type } = Route.useParams();
  const { q } = Route.useSearch();
  return <ListingPage listingType="BUY" type={type} initialQuery={q} />;
}
