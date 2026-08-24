import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/HomePage";
import { getPublicPropertiesFn } from "@/lib/properties.functions";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const { queryClient } = context;
    await Promise.race([
      queryClient.prefetchQuery({
        queryKey: ["public-properties"],
        queryFn: () => getPublicPropertiesFn(),
        staleTime: 60_000,
      }),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Touch Stone Properties — Luxury Real Estate in Bangalore" },
      {
        name: "description",
        content:
          "Curated apartments, villas, plots and commercial properties across Bangalore. 3,200+ verified listings.",
      },
      { property: "og:title", content: "Touch Stone Properties" },
      {
        property: "og:description",
        content: "Bangalore's most trusted luxury real estate broker.",
      },
      {
        property: "og:image",
        content:
          "/src/assets/images/hero/welcome.jpg",
      },
    ],
  }),
  component: HomePage,
});

