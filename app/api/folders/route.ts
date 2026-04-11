import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { createImapClient } from "@/lib/imap";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const client = createImapClient(session);
  try {
    await client.connect();
    const mailboxes = await client.list();

    const folders = mailboxes.map((mb: any) => ({
      name: mb.name,
      path: mb.path,
      delimiter: mb.delimiter,
      flags: mb.flags ? Array.from(mb.flags) : [],
      specialUse: mb.specialUse || null,
    }));

    return NextResponse.json({ success: true, folders });
  } catch (err) {
    console.error("Folders error:", err);
    return NextResponse.json(
      { success: false, error: `Failed to list folders: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  } finally {
    try { await client.logout(); } catch {}
  }
}
