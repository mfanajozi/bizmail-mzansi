import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const RAW_KEY =
  process.env.EMAIL_SECRET_KEY ||
  "default-dev-key-change-in-production-min-32ch";
const secret = new TextEncoder().encode(RAW_KEY.padEnd(32, "0").slice(0, 32));

export const SESSION_COOKIE = "__bizmail_session";

export interface SessionData {
  accountId: string;
  email: string;
  name: string;
  encryptedPassword: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  colorTag: string;
}

export async function createSession(data: SessionData): Promise<string> {
  return new SignJWT({ ...data })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionData;
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(
  req: NextRequest
): Promise<SessionData | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionData;
  } catch {
    return null;
  }
}
