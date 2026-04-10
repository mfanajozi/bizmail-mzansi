import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { decrypt, getAccount } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, to, subject, body: emailBody } = body;

    const account = getAccount(accountId);
    if (!account) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404 }
      );
    }

    const password = decrypt(account.encryptedPassword);
    if (!password) {
      return NextResponse.json(
        { success: false, error: "Failed to decrypt password" },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.smtpPort === 465,
      auth: {
        user: account.email,
        pass: password,
      },
    });

    await transporter.sendMail({
      from: account.email,
      to,
      subject,
      html: emailBody,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send error:", error);
    return NextResponse.json(
      { success: false, error: `Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}