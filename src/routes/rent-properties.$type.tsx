import { createFileRoute } from "@tanstack/react-router";
import { ListingPage } from "@/components/ListingPage";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const Route = createFileRoute("/rent-properties/$type")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => {
    const q = typeof search.q === "string" ? search.q : "";
    return q ? { q } : {};
  },
  head: ({ params }) => ({
    meta: [
      { title: `Rent ${cap(params.type)} in Bangalore — Touch Stone Properties` },
      {
        name: "description",
        content: `Premium ${params.type} for rent in Bangalore. Fully furnished, RERA-verified.`,
      },
    ],
  }),
  component: RentPage,
});


function RentPage() {
  const { type } = Route.useParams();
  const { q } = Route.useSearch();
  return <ListingPage listingType="RENT" type={type} initialQuery={q} />;
}
