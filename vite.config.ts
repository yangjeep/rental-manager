import { defineConfig } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";
import { cloudflareDevProxyVitePlugin } from "@remix-run/dev/dist/vite/cloudflare-proxy-plugin.js";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Load .env file for local development
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

const env = process.env as Record<string, string>;

export default defineConfig({
  plugins: [
    cloudflareDevProxyVitePlugin({
      getLoadContext: ({ context }) => ({
        cloudflare: {
          ...context.cloudflare,
          env: {
            ...context.cloudflare.env,
            ...env, // .env file values override wrangler env
          },
        },
      }),
    }),
    remix(),
  ],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "."),
    },
  },
});

