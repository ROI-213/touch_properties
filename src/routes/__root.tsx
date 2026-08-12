import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "react-hot-toast";

import appCss from "../styles.css?url";
import brandIcon from "../assets/brand/icon.png?url";

import { getBrandSettings } from "@/lib/site-cms";

import { WhatsAppButton } from "../components/WhatsAppButton";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { EnquireModalProvider } from "@/contexts/EnquireModalContext";
import { ShareModalProvider } from "@/contexts/ShareModalContext";
import { CompareFloatingBar } from "@/components/CompareFloatingBar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { SeoSync } from "@/components/SeoSync";
import { useCmsRealtime } from "@/hooks/useCmsRealtime";

function CmsRealtimeBridge() {
  // Only subscribe on admin pages — public visitors don't need the live
  // WebSocket, which was adding significant startup work in production.
  if (typeof window === "undefined") return null;
  if (!window.location.pathname.startsWith("/admin")) return null;
  return <CmsRealtimeInner />;
}

function CmsRealtimeInner() {
  useCmsRealtime();
  return null;
}


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4 py-20">
      <div className="relative mx-auto max-w-xl text-center">
        {/* Giant 404 watermark */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-[120px] font-bold leading-none text-gold opacity-20 sm:text-[180px]"
        >
          404
        </div>

        {/* Broken-building line illustration */}
        <svg
          viewBox="0 0 280 200"
          className="relative mx-auto h-[200px] w-[280px] text-charcoal"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M40 180 L40 70 L140 30 L240 70 L240 180 Z" />
          <line x1="20" y1="180" x2="260" y2="180" />
          {/* windows */}
          <rect x="65" y="95" width="28" height="32" />
          <rect x="113" y="95" width="28" height="32" stroke="hsl(var(--gold))" />
          <rect x="161" y="95" width="28" height="32" />
          <rect x="209" y="95" width="22" height="32" />
          {/* broken glass */}
          <line x1="113" y1="95" x2="141" y2="127" stroke="hsl(var(--gold))" />
          <line x1="141" y1="95" x2="113" y2="127" stroke="hsl(var(--gold))" />
          {/* door */}
          <path d="M125 180 L125 145 Q140 135 155 145 L155 180" />
        </svg>

        <h1 className="relative mt-6 font-display text-3xl font-semibold text-charcoal sm:text-4xl">
          Property Not Found
        </h1>
        <p className="relative mt-3 text-sm text-charcoal/60 sm:text-base">
          Looks like this property has gone off-market.
        </p>

        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-gold-light"
          >
            Go Back to Homepage
          </Link>
          <Link
            to="/buy-properties/$type"
            params={{ type: "apartments" }}
            className="inline-flex items-center justify-center rounded-full border border-gold px-6 py-3 text-sm font-semibold text-gold transition hover:bg-gold hover:text-white"
          >
            Browse Properties
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const retryKey =
    typeof window === "undefined"
      ? ""
      : `root-error-retry:${window.location.pathname}${window.location.search}`;

  // Explicit manual retry when needed, avoid automatic loop that triggers 2nd reloads
  const handleRetry = () => {
    if (retryKey) window.sessionStorage.removeItem(retryKey);
    void router.invalidate({ sync: true }).finally(reset);
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl text-charcoal">This page didn't load</h1>
        <p className="mt-2 text-sm text-charcoal/60">
          Something went wrong. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              if (retryKey) window.sessionStorage.removeItem(retryKey);
              void router.invalidate({ sync: true }).finally(reset);
            }}
            className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-white"
          >
            Try again
          </button>
          <Link
            to="/"
            onClick={() => {
              if (retryKey) window.sessionStorage.removeItem(retryKey);
              void router.invalidate({ sync: true });
              reset();
            }}
            className="rounded-full border border-charcoal/15 bg-white px-5 py-2.5 text-sm font-medium text-charcoal"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

import { getPublicPropertiesFn } from "@/lib/properties.functions";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async ({ context }) => {
    // Prefetch brand settings & public properties during SSR so the navbar logo/name,
    // footer, and property sections render with real data in the initial HTML (instead
    // of popping in after a client-side round trip). Capped with a timeout so a slow DB
    // can never block the page render.
    const { queryClient } = context;
    await Promise.race([
      Promise.all([
        queryClient.prefetchQuery({
          queryKey: ["site-brand"],
          queryFn: getBrandSettings,
          staleTime: 30_000,
        }),
        queryClient.prefetchQuery({
          queryKey: ["public-properties"],
          queryFn: () => getPublicPropertiesFn(),
          staleTime: 60_000,
        }),
      ]),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  },

  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Touch Stone Properties — Bangalore's Most Trusted Luxury Real Estate Broker" },
      {
        name: "description",
        content:
          "Premium apartments, villas, plots and commercial spaces in Bangalore. 3,200+ verified properties, RERA-compliant, white-glove service for discerning buyers and NRI investors.",
      },
      { name: "author", content: "Touch Stone Properties" },
      { property: "og:title", content: "Touch Stone Properties — Bangalore's Most Trusted Luxury Real Estate Broker" },
      { property: "og:description", content: "A simple web application demonstrating a basic \"Hello, World!\" message." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Touch Stone Properties — Bangalore's Most Trusted Luxury Real Estate Broker" },
      { name: "description", content: "A simple web application demonstrating a basic \"Hello, World!\" message." },
      { name: "twitter:description", content: "A simple web application demonstrating a basic \"Hello, World!\" message." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cbb546f0-1ff3-4e0d-bc45-b7ec9071dd54/id-preview-d3bd606d--0c65c51b-8baa-40c9-92a8-3fc35fc2b19f.lovable.app-1782128799457.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cbb546f0-1ff3-4e0d-bc45-b7ec9071dd54/id-preview-d3bd606d--0c65c51b-8baa-40c9-92a8-3fc35fc2b19f.lovable.app-1782128799457.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: brandIcon },
      { rel: "apple-touch-icon", href: brandIcon },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="overflow-x-hidden">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const location = useRouterState({ select: (state) => state.location });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(`root-error-retry:${location.pathname}${location.searchStr}`);
  }, [location.pathname, location.searchStr]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary
        resetKey={`${location.pathname}${location.searchStr}`}
        onRetry={() => void router.invalidate({ sync: true })}
      >
        <AuthProvider>
          <AuthModalProvider>
            <EnquireModalProvider>
              <ShareModalProvider>
                <CmsRealtimeBridge />
                <Outlet />
                <SeoSync />
                <WhatsAppButton />
                <AuthModal />
                <CompareFloatingBar />
                <MobileBottomNav />
                <Toaster position="bottom-center" />
              </ShareModalProvider>
            </EnquireModalProvider>
          </AuthModalProvider>
        </AuthProvider>
      </AppErrorBoundary>
    </QueryClientProvider>
  );
}
