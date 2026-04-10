import crypto from "crypto";

const ENCRYPTION_KEY = process.env.EMAIL_SECRET_KEY || "default-dev-key-change-in-production-min-32ch";
const IV_LENGTH = 16;
const ALGORITHM = "aes-256-cbc";

export function encrypt(text: string): string {
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(encryptedText: string): string {
  try {
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32));
    const [ivHex, encrypted] = encryptedText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return "";
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}

export interface AccountData {
  id: string;
  email: string;
  name: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  encryptedPassword: string;
  colorTag: string;
  totalStorage: number;
  usedStorage: number;
  createdAt: string;
}

const accounts: Map<string, AccountData> = new Map();

export function addAccount(account: AccountData) {
  accounts.set(account.id, account);
}

export function getAccount(id: string) {
  return accounts.get(id);
}

export function getAllAccounts() {
  return Array.from(accounts.values());
}