import { NextRequest, NextResponse } from "next/server";
import { encrypt, generateId } from "@/lib/crypto";
import { createSession, SESSION_COOKIE, SessionData } from "@/lib/session";
import { createImapClient } from "@/lib/imap";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, imapHost, imapPort, smtpHost, smtpPort, accountId, colorTag, name } = body;

    if (!email || !password || !imapHost || !smtpHost) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const encryptedPassword = encrypt(password);
    const id = accountId || generateId();
    const accountName = name || email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());

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
      return NextResponse.json(
        {
          success: false,
          error: `Authentication failed: ${err instanceof Error ? err.message : "Invalid credentials"}`,
        },
        { status: 401 }
      );
    }

    const token = await createSession(sessionData);

    const res = NextResponse.json({ success: true });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
