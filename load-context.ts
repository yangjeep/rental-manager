import type { AppLoadContext } from "@remix-run/cloudflare";
import type { PlatformProxy } from "wrangler";

export interface Env {
  AIRTABLE_TOKEN: string;
  AIRTABLE_BASE_ID: string;
  AIRTABLE_INVENTORY_TABLE_NAME?: string;
  AIRTABLE_R2_IMAGE_FIELD?: string;
  GOOGLE_MAPS_API_KEY?: string;
  R2_PUBLIC_BASE_URL?: string;
  DEMO_USER?: string;
  DEMO_PASS?: string;
  DEMO_NOINDEX?: string;
}

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: Omit<PlatformProxy<Env>, "dispose">;
  }
}

