import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/session";

const RAW_KEY =
  process.env.EMAIL_SECRET_KEY ||
  "default-dev-key-change-in-production-min-32ch";
const secret = new TextEncoder().encode(RAW_KEY.padEnd(32, "0").slice(0, 32));

const PROTECTED = ["/mailbox", "/compose", "/dashboard", "/settings", "/accounts", "/inbox"];
const AUTH_ONLY = ["/login", "/setup"];

async function isValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY.some((p) => pathname.startsWith(p));

  const valid = await isValidSession(request);

  if (isProtected && !valid) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthOnly && valid) {
    const url = request.nextUrl.clone();
    url.pathname = "/mailbox";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/mailbox/:path*",
    "/compose",
    "/dashboard",
    "/settings",
    "/accounts",
    "/inbox",
    "/login",
    "/setup",
  ],
};
