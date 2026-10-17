// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";
import path from "path";

const mode = process.env.NODE_ENV || "development";
Object.assign(process.env, loadEnv(mode, process.cwd(), ""), process.env);

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    ...(process.env.NITRO_PRESET ? { preset: process.env.NITRO_PRESET } : {}),
    vercel: {
      functions: {
        runtime: "nodejs20.x",
      },
    },
  },
  vite: {
    server: {
      host: "::",
      port: 8231,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  },
});