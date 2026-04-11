import { NextRequest, NextResponse } from "next/server";
import { encrypt, generateId } from "@/lib/crypto";
import { createSession, SESSION_COOKIE, SessionData } from "@/lib/session";
import { createImapClient } from "@/lib/imap";

type AuthErrorCode =
  | "wrong_password"
  | "server_unreachable"
  | "timeout"
  | "ssl_error"
  | "unknown";

function classifyImapError(err: unknown): AuthErrorCode {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();

  // Wrong credentials
  if (
    msg.includes("command failed") ||
    msg.includes("authentication failed") ||
    msg.includes("invalid credentials") ||
    msg.includes("login failed") ||
    msg.includes("bad credentials") ||
    msg.includes("[authenticationfailed]") ||
    msg.includes("no login") ||
    msg.includes("535") ||   // SMTP auth error code
    msg.includes("534")
  ) {
    return "wrong_password";
  }

  // Server not found / connection refused
  if (
    msg.includes("enotfound") ||
    msg.includes("econnrefused") ||
    msg.includes("network") ||
    msg.includes("getaddrinfo") ||
    msg.includes("dns")
  ) {
    return "server_unreachable";
  }

  // Timeout
  if (
    msg.includes("etimedout") ||
    msg.includes("timeout") ||
    msg.includes("econnreset")
  ) {
    return "timeout";
  }

  // SSL / certificate
  if (
    msg.includes("cert") ||
    msg.includes("ssl") ||
    msg.includes("tls") ||
    msg.includes("self signed") ||
    msg.includes("unable to verify")
  ) {
    return "ssl_error";
  }

  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, imapHost, imapPort, smtpHost, smtpPort, accountId, colorTag, name } = body;

    if (!email || !password || !imapHost || !smtpHost) {
      return NextResponse.json(
        { success: false, errorCode: "unknown", error: "Missing required fields" },
        { status: 400 }
      );
    }

    const encryptedPassword = encrypt(password);
    const id = accountId || generateId();
    const accountName =
      name ||
      email
        .split("@")[0]
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (l: string) => l.toUpperCase());

    const sessionData: SessionData = {
      accountId: id,
      email,
      name: accountName,
      encryptedPassword,
      imapHost,
      imapPort: parseInt(imapPort) || 993,
      smtpHost,
      smtpPort: parseInt(smtpPort) || 587,
      colorTag: colorTag || "green",
    };

    // Verify credentials against IMAP
    const client = createImapClient(sessionData);
    try {
      await client.connect();
      await client.logout();
    } catch (err) {
      const errorCode = classifyImapError(err);
      return NextResponse.json(
        { success: false, errorCode },
        { status: 401 }
      );
    }

    const token = await createSession(sessionData);

    const res = NextResponse.json({ success: true });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, errorCode: "unknown" },
      { status: 500 }
    );
  }
}
