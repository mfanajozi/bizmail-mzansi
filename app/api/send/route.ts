import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getSessionFromRequest } from "@/lib/session";
import { getPassword } from "@/lib/imap";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { to, subject, body: emailBody, cc, replyTo } = body;

    if (!to || !subject) {
      return NextResponse.json({ success: false, error: "Missing to or subject" }, { status: 400 });
    }

    const password = getPassword(session);
    if (!password) {
      return NextResponse.json({ success: false, error: "Failed to get credentials" }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: session.smtpHost,
      port: session.smtpPort,
      secure: session.smtpPort === 465,
      auth: {
        user: session.email,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `${session.name} <${session.email}>`,
      to,
      cc: cc || undefined,
      replyTo: replyTo || undefined,
      subject,
      html: emailBody,
      text: emailBody?.replace(/<[^>]*>/g, "") || "",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send error:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to send: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
