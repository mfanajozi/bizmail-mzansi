import { NextRequest, NextResponse } from "next/server";
import { encrypt, generateId, addAccount } from "@/lib/crypto";

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
    
    const colorTags = ["bg-green-600", "bg-yellow-500", "bg-blue-600", "bg-red-600", "bg-purple-600", "bg-orange-500"];
    const colorTag = colorTags[Math.floor(Math.random() * colorTags.length)];

    const account = {
      id,
      email,
      name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
      imapHost,
      imapPort: parseInt(imapPort) || 993,
      smtpHost,
      smtpPort: parseInt(smtpPort) || 587,
      encryptedPassword,
      colorTag,
      totalStorage: 5000,
      usedStorage: 0,
      createdAt: new Date().toISOString(),
    };

    addAccount(account);
    console.log("Account connected:", account.email);

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        email: account.email,
        name: account.name,
        colorTag: account.colorTag,
        totalStorage: account.totalStorage,
        usedStorage: account.usedStorage,
      },
    });
  } catch (error) {
    console.error("Connection error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to connect account" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Use POST to connect an account" },
    { status: 405 }
  );
}