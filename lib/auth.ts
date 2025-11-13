import type { EnvSource } from "./env";
import { readEnv } from "./env";

export function requireBasicAuth(env: EnvSource, request: Request): Response | undefined {
  const user = readEnv(env, "DEMO_USER");
  const pass = readEnv(env, "DEMO_PASS");
  if (!user || !pass) {
    return undefined;
  }

  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Basic ")) {
    return unauthorized();
  }

  const decoded = decodeBasic(header.slice(6));
  const [providedUser, providedPass] = decoded.split(":");
  if (providedUser !== user || providedPass !== pass) {
    return unauthorized();
  }
  return undefined;
}

function unauthorized(): Response {
  return new Response("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": "Basic realm=\"Rentals\"" },
  });
}

function decodeBasic(value: string): string {
  if (typeof atob === "function") {
    return atob(value);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "base64").toString("utf8");
  }
  throw new Error("No base64 decoder available");
}
