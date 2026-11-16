import { NextRequest, NextResponse } from "next/server";

import {
  decryptSession,
  SESSION_COOKIE_NAME,
  type Role,
} from "./src/lib/session";

const protectedRoutes = [
  { prefix: "/account", roles: ["CLIENT"] as const },
  { prefix: "/moderator", roles: ["MODERATOR", "ADMIN"] as const },
  { prefix: "/admin", roles: ["ADMIN"] as const },
] satisfies ReadonlyArray<{ prefix: string; roles: readonly Role[] }>;

function getProtectedRoute(pathname: string) {
  return protectedRoutes.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function loginRedirect(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const protectedRoute = getProtectedRoute(pathname);

  if (!isAuthPage && !protectedRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await decryptSession(token) : null;

  if (isAuthPage) {
    if (!session) {
      return NextResponse.next();
    }

    const dashboard = session.role === "ADMIN"
      ? "/admin"
      : session.role === "MODERATOR"
        ? "/moderator"
        : "/account";

    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  if (!protectedRoute) {
    return NextResponse.next();
  }

  if (!session) {
    return loginRedirect(request);
  }

  if (!protectedRoute.roles.some((role) => role === session.role)) {
    return NextResponse.redirect(new URL("/forbidden", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/account/:path*", "/moderator/:path*", "/admin/:path*"],
};
