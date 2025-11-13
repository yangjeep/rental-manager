export type EnvSource = Record<string, string | undefined>;

export function readEnv(source: EnvSource, key: string): string | undefined {
  if (source && source[key] !== undefined) {
    return source[key];
  }
  if (typeof process !== "undefined" && process.env && process.env[key] !== undefined) {
    return process.env[key];
  }
  return undefined;
}

export function envFlag(source: EnvSource, key: string): boolean {
  const value = readEnv(source, key);
  if (!value) return false;
  return value === "1" || value.toLowerCase() === "true";
}
