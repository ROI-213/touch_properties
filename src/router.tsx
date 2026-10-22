import { QueryClient } from "@tanstack/react-query";
import { createRouter, Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { routeTree } from "./routeTree.gen";

function isChunkLoadError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error ?? "")).toLowerCase();
  return (
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("importing a module script failed") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("unable to preload css") ||
    msg.includes("loading chunk")
  );
}

function DefaultErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const errMsg = error instanceof Error ? error.message : String(error ?? "");

  useEffect(() => {
    if (typeof window !== "undefined" && isChunkLoadError(error)) {
      const key = `chunk-reload:${window.location.pathname}`;
      if (!window.sessionStorage.getItem(key)) {
        window.sessionStorage.setItem(key, "1");
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl text-charcoal">This page didn't load</h1>
        <p className="mt-2 text-sm text-charcoal/60">
          Something went wrong while loading this page. Please try again or return home.
        </p>
        {errMsg ? (
          <p className="mt-2 break-words text-xs text-charcoal/40">{errMsg}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => void router.invalidate({ sync: true }).finally(reset)}
            className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-white"
          >
            Try again
          </button>
          <Link
            to="/"
            onClick={reset}
            className="rounded-full border border-charcoal/15 bg-white px-5 py-2.5 text-sm font-medium text-charcoal"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

let queryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a new QueryClient
    return new QueryClient({
      defaultOptions: {
        queries: {
          retry: (failureCount, error: any) => {
            const status = error?.status ?? error?.statusCode;
            if (status === 401 || status === 403 || status === 404) return false;
            return failureCount < 3;
          },
          retryDelay: (attemptIndex) =>
            Math.min(1000 * 2 ** attemptIndex, 8000) + Math.floor(Math.random() * 250),
          staleTime: 60_000,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
        },
      },
    });
  }
  // Client: create once
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: (failureCount, error: any) => {
            const status = error?.status ?? error?.statusCode;
            if (status === 401 || status === 403 || status === 404) return false;
            return failureCount < 3;
          },
          retryDelay: (attemptIndex) =>
            Math.min(1000 * 2 ** attemptIndex, 8000) + Math.floor(Math.random() * 250),
          staleTime: 60_000,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
        },
      },
    });
  }
  return queryClient;
}

export const getRouter = () => {
  const qc = getQueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient: qc },
    scrollRestoration: false,
    defaultStaleTime: 60_000,
    defaultPreloadStaleTime: 60_000,
    defaultErrorComponent: DefaultErrorComponent,
  });

  return router;
};
