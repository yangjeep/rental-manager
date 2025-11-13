export type EnvSource = Record<string, string | undefined>;

export function readEnv(source: EnvSource, key: string): string | undefined {
  if (!source) return undefined;
  return source[key];
}

export function envFlag(source: EnvSource, key: string): boolean {
  const value = readEnv(source, key);
  if (!value) return false;
  return value === "1" || value.toLowerCase() === "true";
}
