import * as ImapFlowModule from "imapflow";
import { SessionData } from "./session";
import { decrypt } from "./crypto";

const ImapFlow = ImapFlowModule.ImapFlow;

export function createImapClient(session: SessionData) {
  const password = decrypt(session.encryptedPassword);
  return new ImapFlow({
    host: session.imapHost,
    port: session.imapPort,
    secure: session.imapPort === 993,
    auth: {
      user: session.email,
      pass: password,
    },
    logger: false,
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export function getPassword(session: SessionData): string {
  return decrypt(session.encryptedPassword);
}
