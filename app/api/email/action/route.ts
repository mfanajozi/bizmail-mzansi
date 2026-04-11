import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { createImapClient } from "@/lib/imap";

// Actions: mark-read, mark-unread, delete, move, flag, unflag
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { uids, action, folder = "INBOX", destination } = body;

  if (!uids || !action) {
    return NextResponse.json({ success: false, error: "Missing uids or action" }, { status: 400 });
  }

  const uidList = Array.isArray(uids) ? uids : [uids];
  const uidRange = uidList.join(",");

  const client = createImapClient(session);
  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);

    try {
      switch (action) {
        case "mark-read":
          await client.messageFlagsAdd(uidRange, ["\\Seen"], { uid: true });
          break;
        case "mark-unread":
          await client.messageFlagsRemove(uidRange, ["\\Seen"], { uid: true });
          break;
        case "flag":
          await client.messageFlagsAdd(uidRange, ["\\Flagged"], { uid: true });
          break;
        case "unflag":
          await client.messageFlagsRemove(uidRange, ["\\Flagged"], { uid: true });
          break;
        case "delete":
          await client.messageMove(uidRange, "Trash", { uid: true }).catch(async () => {
            // Fallback: mark as deleted
            await client.messageFlagsAdd(uidRange, ["\\Deleted"], { uid: true });
            await client.messageDelete(uidRange, { uid: true });
          });
          break;
        case "move":
          if (!destination) {
            return NextResponse.json({ success: false, error: "Missing destination" }, { status: 400 });
          }
          await client.messageMove(uidRange, destination, { uid: true });
          break;
        default:
          return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    } finally {
      lock.release();
    }
  } catch (err) {
    console.error("Email action error:", err);
    return NextResponse.json(
      { success: false, error: `Action failed: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  } finally {
    try { await client.logout(); } catch {}
  }
}
