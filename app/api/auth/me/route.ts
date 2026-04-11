import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    account: {
      id: session.accountId,
      email: session.email,
      name: session.name,
      colorTag: session.colorTag,
      imapHost: session.imapHost,
      imapPort: session.imapPort,
      smtpHost: session.smtpHost,
      smtpPort: session.smtpPort,
    },
  });
}
