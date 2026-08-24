import { useQuery } from "@tanstack/react-query";
import {
  ABOUT_DEFAULTS,
  BRAND_DEFAULTS,
  PARTNERS_SECTION_DEFAULTS,
  getAboutContent,
  getBrandSettings,
  getPartnersSection,
  listFaqs,
  listNavigationItems,
  listPartners,
  listSuccessStories,
  listTestimonials,
  type AboutContent,
  type FaqRow,
  type NavigationItem,
  type Partner,
  type PartnersSection,
  type SuccessStoryRow,
  type Testimonial,
} from "@/lib/site-cms";

export function usePartnersSection() {
  const q = useQuery({
    queryKey: ["site-partners-section"],
    queryFn: getPartnersSection,
    staleTime: 60_000,
  });
  return { section: (q.data ?? PARTNERS_SECTION_DEFAULTS) as PartnersSection, isLoading: q.isLoading };
}

export function useBrandSettings() {
  const q = useQuery({
    queryKey: ["site-brand"],
    queryFn: getBrandSettings,
    staleTime: 60_000,
  });
  return { brand: q.data ?? BRAND_DEFAULTS, isLoading: q.isLoading };
}

export function useNavigation(location: "header" | "footer") {
  const q = useQuery({
    queryKey: ["site-nav", location],
    queryFn: () => listNavigationItems(location),
    staleTime: 60_000,
  });
  return { items: (q.data ?? []) as NavigationItem[], isLoading: q.isLoading };
}

export function useTestimonials(activeOnly = true) {
  const q = useQuery({
    queryKey: ["site-testimonials", activeOnly],
    queryFn: () => listTestimonials(activeOnly),
    staleTime: 60_000,
  });
  return { items: (q.data ?? []) as Testimonial[], isLoading: q.isLoading };
}

export function usePartners(activeOnly = true) {
  const q = useQuery({
    queryKey: ["site-partners", activeOnly],
    queryFn: () => listPartners(activeOnly),
    staleTime: 60_000,
  });
  return { items: (q.data ?? []) as Partner[], isLoading: q.isLoading };
}

export function useSuccessStories(activeOnly = true) {
  const q = useQuery({
    queryKey: ["site-stories", activeOnly],
    queryFn: () => listSuccessStories(activeOnly),
    staleTime: 60_000,
  });
  return { items: (q.data ?? []) as SuccessStoryRow[], isLoading: q.isLoading };
}

export function useFaqs(activeOnly = true) {
  const q = useQuery({
    queryKey: ["site-faqs", activeOnly],
    queryFn: () => listFaqs(activeOnly),
    staleTime: 60_000,
  });
  return { items: (q.data ?? []) as FaqRow[], isLoading: q.isLoading };
}

export function useAboutContent() {
  const q = useQuery({
    queryKey: ["site-about"],
    queryFn: getAboutContent,
    staleTime: 60_000,
  });
  return { content: (q.data ?? ABOUT_DEFAULTS) as AboutContent, isLoading: q.isLoading };
}
