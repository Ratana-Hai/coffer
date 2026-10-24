import { NextResponse } from "next/server";
import { auth } from "@/server/auth/edge";

const PROTECTED = ["/overview", "/transactions", "/budgets", "/loans", "/goals", "/settings"];

export const proxy = auth((req) => {
  const session = req.auth as { user?: { id?: string }; twoFactorVerified?: boolean } | null;
  const { pathname } = req.nextUrl;

  const isLoggedIn = Boolean(session?.user?.id);
  const twoFactorPending = isLoggedIn && session?.twoFactorVerified === false;

  const isProtected = PROTECTED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected) {
    if (!isLoggedIn) {
      const url = new URL("/sign-in", req.nextUrl);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (twoFactorPending) {
      return NextResponse.redirect(new URL("/verify", req.nextUrl));
    }
    return NextResponse.next();
  }

  if (pathname === "/verify") {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/sign-in", req.nextUrl));
    if (!twoFactorPending) return NextResponse.redirect(new URL("/overview", req.nextUrl));
    return NextResponse.next();
  }

  if (pathname === "/sign-in" || pathname === "/sign-up") {
    if (isLoggedIn) {
      return NextResponse.redirect(
        new URL(twoFactorPending ? "/verify" : "/overview", req.nextUrl),
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
