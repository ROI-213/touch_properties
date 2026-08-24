// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    // "node-server" (default) produces .output/server/index.mjs, run with
    //   node .output/server/index.mjs
    // Override per environment when deploying elsewhere, e.g. on Vercel set
    // NITRO_PRESET=vercel or on Cloudflare NITRO_PRESET=cloudflare-pages.
    preset: process.env.NITRO_PRESET || "node-server",
  },
  vite: {
    esbuild: {
      drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
    },
  },
});

