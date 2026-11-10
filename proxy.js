import { NextResponse } from "next/server";

const publicPaths = ["/login", "/register", "/", "/logout", "/dashboard"];

// Export as 'proxy' for Next.js 16+
export function proxy(request) {
  const token = request.cookies.get("inventory_auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Create response
  const response = NextResponse.next();

  // Add cache-control headers to prevent caching of authenticated pages
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  // Allow public paths
  if (publicPaths.includes(pathname) || pathname === "/dashboard") {
    // If user is logged in and tries to access login/register, redirect to dashboard
    if (token && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  // Protect other administrative routes if unauthenticated
  const protectedPrefixes = [
    "/inventory",
    "/assignments",
    "/livestock",
    "/feeds",
    "/locations",
    "/users",
    "/maintenance",
    "/reservations",
    "/approvals",
    "/audit-logs",
    "/reports",
    "/settings",
    "/categories",
    "/stock-movements",
    "/stock-transfers",
    "/suppliers",
    "/purchase-orders",
    "/product-assignments",
    "/notifications",
  ];

  // Check if the pathname starts with any protected prefix
  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    if (!token) {
      // No token, redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }
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
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
