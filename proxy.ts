import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "./lib/supabase/proxy-session";

const PUBLIC_PATHS = ["/login", "/offline", "/manifest.webmanifest"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return true;
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/firebase-messaging-config.js") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|js|css|woff2?)$/)
  ) {
    return true;
  }

  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { supabaseResponse, user } = await updateSession(request);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  function redirectWithSession(url: URL) {
    const redirect = NextResponse.redirect(url);
    for (const cookie of supabaseResponse.cookies.getAll()) {
      redirect.cookies.set(cookie.name, cookie.value);
    }
    return redirect;
  }

  if (isPublicPath(pathname)) {
    if (user && pathname === "/login") {
      return redirectWithSession(new URL("/dashboard", request.url));
    }
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return redirectWithSession(loginUrl);
  }

  if (pathname === "/") {
    return redirectWithSession(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
