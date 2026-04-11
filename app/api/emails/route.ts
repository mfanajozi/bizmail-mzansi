import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { createImapClient } from "@/lib/imap";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const folder = searchParams.get("folder") || "INBOX";
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = 50;

  const client = createImapClient(session);
  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);

    try {
      const mailboxInfo = client.mailbox as any;
      const total = mailboxInfo?.exists ?? 0;

      if (total === 0) {
        return NextResponse.json({ success: true, emails: [], total: 0, page, perPage });
      }

      // Calculate range (newest first)
      const end = Math.max(1, total - (page - 1) * perPage);
      const start = Math.max(1, end - perPage + 1);
      const range = `${start}:${end}`;

      const emails: any[] = [];

      for await (const msg of client.fetch(range, {
        uid: true,
        envelope: true,
        flags: true,
        bodyStructure: true,
        size: true,
      })) {
        const from = msg.envelope?.from?.[0];
        const fromStr = from
          ? from.name
            ? `${from.name} <${from.address}>`
            : (from.address ?? "Unknown")
          : "Unknown";

        emails.push({
          uid: msg.uid,
          seq: msg.seq,
          subject: msg.envelope?.subject || "(No Subject)",
          from: fromStr,
          fromAddress: from?.address || "",
          to: msg.envelope?.to?.map((a: any) => a.address).join(", ") || "",
          date: msg.envelope?.date?.toISOString() || new Date().toISOString(),
          read: msg.flags?.has("\\Seen") ?? false,
          flagged: msg.flags?.has("\\Flagged") ?? false,
          hasAttachments: hasAttachmentParts(msg.bodyStructure),
          size: msg.size || 0,
        });
      }

      // Reverse so newest is first
      emails.reverse();

      return NextResponse.json({ success: true, emails, total, page, perPage, folder });
    } finally {
      lock.release();
    }
  } catch (err) {
    console.error("Emails fetch error:", err);
    return NextResponse.json(
      { success: false, error: `Failed to fetch emails: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  } finally {
    try { await client.logout(); } catch {}
  }
}

function hasAttachmentParts(structure: any): boolean {
  if (!structure) return false;
  if (structure.disposition === "attachment") return true;
  if (structure.childNodes) {
    return structure.childNodes.some(hasAttachmentParts);
  }
  return false;
}
