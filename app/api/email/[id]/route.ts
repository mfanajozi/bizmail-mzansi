import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { createImapClient } from "@/lib/imap";
import { simpleParser } from "mailparser";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const uid = parseInt(id);
  if (isNaN(uid)) {
    return NextResponse.json({ success: false, error: "Invalid email ID" }, { status: 400 });
  }

  const { searchParams } = request.nextUrl;
  const folder = searchParams.get("folder") || "INBOX";

  const client = createImapClient(session);
  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);

    try {
      const msg = await client.fetchOne(
        String(uid),
        { source: true, flags: true, envelope: true },
        { uid: true }
      );

      if (!msg || !msg.source) {
        return NextResponse.json({ success: false, error: "Email not found" }, { status: 404 });
      }

      const parsed = await simpleParser(msg.source);

      // Mark as read by adding \Seen flag
      try {
        await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
      } catch {}

      const from = parsed.from?.value?.[0];
      const fromStr = from
        ? from.name
          ? `${from.name} <${from.address}>`
          : (from.address ?? "Unknown")
        : "Unknown";

      return NextResponse.json({
        success: true,
        email: {
          uid,
          subject: parsed.subject || "(No Subject)",
          from: fromStr,
          fromAddress: from?.address || "",
          to: Array.isArray(parsed.to) ? parsed.to.map((a: any) => a.text).join(", ") : (parsed.to as any)?.text || "",
          cc: Array.isArray(parsed.cc) ? parsed.cc.map((a: any) => a.text).join(", ") : (parsed.cc as any)?.text || "",
          date: parsed.date?.toISOString() || new Date().toISOString(),
          html: parsed.html || null,
          text: parsed.text || null,
          attachments: parsed.attachments?.map((a) => ({
            filename: a.filename,
            contentType: a.contentType,
            size: a.size,
          })) || [],
          read: true,
          flags: msg.flags ? Array.from(msg.flags) : [],
        },
      });
    } finally {
      lock.release();
    }
  } catch (err) {
    console.error("Email fetch error:", err);
    return NextResponse.json(
      { success: false, error: `Failed to fetch email: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  } finally {
    try { await client.logout(); } catch {}
  }
}
