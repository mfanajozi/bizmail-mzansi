import { NextRequest, NextResponse } from "next/server";
import * as ImapFlowModule from "imapflow";
import { decrypt, getAccount, getAllAccounts } from "@/lib/crypto";

const ImapFlow = ImapFlowModule.ImapFlow;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId } = body;

    const account = getAccount(accountId);
    if (!account) {
      return NextResponse.json(
        { success: false, error: "Account not found. Please add an account first." },
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

    const client = new ImapFlow({
      host: account.imapHost,
      port: account.imapPort,
      secure: account.imapPort === 993,
      auth: {
        user: account.email,
        pass: password,
      },
      logger: false,
    });

    try {
      await client.connect();

      const lock = await client.getMailboxLock("INBOX");
      try {
        const messages = await client.list() as any[];
        const emails = [];

        for (const msg of messages.slice(0, 50)) {
          const envelope = await client.fetch(msg.uid, {
            envelope: true,
          }) as any;

          if (envelope && envelope.envelope) {
            const from = envelope.envelope.from?.[0];
            emails.push({
              id: msg.uid.toString(),
              subject: envelope.envelope.subject?.[0] || "(No Subject)",
              from: from?.name || from?.address || "Unknown",
              to: envelope.envelope.to?.[0]?.address || "",
              date: envelope.envelope.date || new Date().toISOString(),
              preview: `Email from ${from?.address || "Unknown"}`,
              read: msg.flags?.includes?.("\\Seen") || false,
              hasAttachments: msg.flags?.includes?.("\\Attachment") || false,
            });
          }

          if (emails.length >= 20) break;
        }

        return NextResponse.json({
          success: true,
          emails,
          account: {
            id: account.id,
            email: account.email,
            name: account.name,
            colorTag: account.colorTag,
          },
        });
      } finally {
        lock.release();
      }
    } finally {
      await client.logout();
    }
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { success: false, error: `Sync failed: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  const accounts = getAllAccounts();
  return NextResponse.json({ accounts });
}