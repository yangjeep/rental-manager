export type EnvSource = Record<string, string | undefined> | undefined;

/**
 * Read environment variable from Next.js process.env or Cloudflare context.env
 * Works with both Next.js (process.env) and Cloudflare Pages Functions (context.env)
 */
export function readEnv(source: EnvSource, key: string): string | undefined {
  // If source is provided (Cloudflare context.env), use it
  if (source && typeof source === 'object') {
    return source[key];
  }
  // Otherwise, fall back to Next.js process.env
  return process.env[key];
}

export function envFlag(source: EnvSource, key: string): boolean {
  const value = readEnv(source, key);
  if (!value) return false;
  return value === "1" || value.toLowerCase() === "true";
}
