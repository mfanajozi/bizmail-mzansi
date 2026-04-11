import { NextRequest, NextResponse } from "next/server";
import { encrypt, generateId } from "@/lib/crypto";
import { createSession, SESSION_COOKIE, SessionData } from "@/lib/session";
import { createImapClient } from "@/lib/imap";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, imapHost, imapPort, smtpHost, smtpPort } = body;

    if (!email || !password || !imapHost || !smtpHost) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const encryptedPassword = encrypt(password);
    const id = generateId();

    const colorTags = [
      "green",
      "yellow",
      "blue",
      "red",
      "purple",
      "orange",
    ];
    const colorTag = colorTags[Math.floor(Math.random() * colorTags.length)];
    const name = email
      .split("@")[0]
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase());

    const sessionData: SessionData = {
      accountId: id,
      email,
      name,
      encryptedPassword,
      imapHost,
      imapPort: parseInt(imapPort) || 993,
      smtpHost,
      smtpPort: parseInt(smtpPort) || 587,
      colorTag,
    };

    // Verify the IMAP connection actually works
    const client = createImapClient(sessionData);
    try {
      await client.connect();
      await client.logout();
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot connect to IMAP server: ${err instanceof Error ? err.message : "Connection failed"}`,
        },
        { status: 400 }
      );
    }

    const token = await createSession(sessionData);

    const res = NextResponse.json({
      success: true,
      account: {
        id,
        email,
        name,
        colorTag,
        imapHost,
        imapPort: parseInt(imapPort) || 993,
        smtpHost,
        smtpPort: parseInt(smtpPort) || 587,
      },
    });

    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Connection error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to connect account" },
      { status: 500 }
    );
  }
}
