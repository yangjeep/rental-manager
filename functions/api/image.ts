import { requireBasicAuth } from "../../lib/auth";
import { envFlag } from "../../lib/env";

export const onRequestGet: PagesFunction<Record<string, string>> = async context => {
  const { request } = context;
  const url = new URL(request.url);
  const rawUrl = url.searchParams.get("url");
  const noIndex = envFlag(context.env, "DEMO_NOINDEX");

  const authResponse = requireBasicAuth(context.env, request);
  if (authResponse) {
    if (noIndex) {
      authResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
    }
    return authResponse;
  }

  if (!rawUrl) {
    return withRobots(jsonResponse({ error: "Missing url parameter" }, 400), noIndex);
  }

  let decoded = rawUrl;
  try {
    decoded = decodeURIComponent(rawUrl);
  } catch {
    decoded = rawUrl;
  }

  try {
    const upstream = await fetch(decoded, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Cloudflare Worker)",
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!upstream.ok) {
      return withRobots(jsonResponse({ error: `Failed to fetch image: ${upstream.status}` }, upstream.status), noIndex);
    }

    const buffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") || "image/jpeg";

    return withRobots(new Response(buffer, {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    }), noIndex);
  } catch (error) {
    console.error("[image-proxy]", error);
    return withRobots(jsonResponse({ error: "Failed to proxy image" }, 500), noIndex);
  }
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function withRobots(response: Response, noIndex: boolean): Response {
  if (noIndex) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}
