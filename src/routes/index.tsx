import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/HomePage";

export const Route = createFileRoute("/")({
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

