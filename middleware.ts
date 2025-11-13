import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { readEnv, envFlag } from '@/lib/env';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Handle Basic Auth
  const user = readEnv(undefined, "DEMO_USER");
  const pass = readEnv(undefined, "DEMO_PASS");
  
  if (user && pass) {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Rentals"',
        },
      });
    }
    
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
    const [providedUser, providedPass] = decoded.split(":");
    
    if (providedUser !== user || providedPass !== pass) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Rentals"',
        },
      });
    }
  }
  
  // Handle X-Robots-Tag for DEMO_NOINDEX
  const noIndex = envFlag(undefined, "DEMO_NOINDEX");
  if (noIndex) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|txt|woff|woff2|ttf|eot|otf|json|pdf)).*)',
  ],
};

