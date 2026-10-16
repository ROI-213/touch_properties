import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { SearchPanel } from "@/components/SearchPanel";
import { FeaturedProperties } from "@/components/FeaturedProperties";
import { Top10Properties } from "@/components/Top10Properties";
import { HotProperty } from "@/components/HotProperty";
import { AboutHorizontalScroll } from "@/components/AboutHorizontalScroll";
import { AssociatedPartners } from "@/components/AssociatedPartners";
import { PropertyCard } from "@/components/PropertyCard";
import { properties as staticProperties } from "@/data/properties";

import { SuccessStories } from "@/components/SuccessStories";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";

function FeaturedFallback() {
  const list = staticProperties.slice(0, 6);
  return (
    <section className="bg-ivory px-6 py-16 md:py-20">
      <div className="mx-auto w-full">
        <div className="text-center">
          <div className="mx-auto mb-6 h-px w-10 bg-gold" />
          <h2 className="font-display text-[40px] md:text-[50px] font-bold text-charcoal">
            Featured Properties
          </h2>
          <p className="mt-2 text-base text-charcoal/60">Premium &amp; Verified Listings</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((p, i) => (
            <PropertyCard key={p.id} p={p} index={i} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            to="/buy-properties/$type"
            params={{ type: "all" }}
            className="inline-flex h-12 w-[200px] items-center justify-center rounded-full border-[1.5px] border-gold text-sm font-medium text-gold transition-all hover:bg-gold hover:text-white"
          >
            View All Properties →
          </Link>
        </div>
      </div>
    </section>
  );
}

class SafeSection extends Component<
  { children: ReactNode; name: string; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error(`[Home] ${this.props.name} section failed`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <SectionFallback name={this.props.name} />;
    }
    return this.props.children;
  }
}

function SectionFallback({ name }: { name: string }) {
  return (
    <section className="bg-ivory px-6 py-12 text-center text-charcoal">
      <p className="font-display text-2xl font-semibold">{name} is temporarily unavailable</p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-charcoal/60">
        The rest of the website is ready. Please continue browsing or try again shortly.
      </p>
    </section>
  );
}

function HeroFallback() {
  return (
    <section className="flex min-h-[520px] items-center bg-charcoal px-6 pt-28 text-ivory">
      <div className="mx-auto w-full">
        <h1 className="font-display text-5xl font-bold md:text-7xl">Touch Stone Properties</h1>
        <p className="mt-4 max-w-2xl text-lg text-ivory/75">
          Verified apartments, villas, plots and commercial spaces across Bangalore.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/buy-properties/$type" params={{ type: "all" }} className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-charcoal">
            Explore Properties
          </Link>
          <Link to="/contact-us" className="rounded-full border border-ivory/30 px-6 py-3 text-sm font-semibold text-ivory">
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <div className="min-h-screen bg-ivory">
      <SafeSection name="Navigation"><Navbar /></SafeSection>
      <SafeSection name="Hero" fallback={<HeroFallback />}><Hero /></SafeSection>
      <SafeSection name="Search"><SearchPanel /></SafeSection>
      <SafeSection name="Partners"><AssociatedPartners /></SafeSection>
      <SafeSection name="Top properties"><Top10Properties /></SafeSection>
      <SafeSection name="Hot property"><HotProperty /></SafeSection>
      
      <SafeSection name="Featured properties" fallback={<FeaturedFallback />}><FeaturedProperties /></SafeSection>
      <SafeSection name="About"><AboutHorizontalScroll /></SafeSection>
      <SafeSection name="Success stories"><SuccessStories /></SafeSection>
      <SafeSection name="Testimonials"><Testimonials /></SafeSection>
      <SafeSection name="Footer"><Footer /></SafeSection>
    </div>
  );
}
