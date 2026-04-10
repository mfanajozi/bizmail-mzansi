import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import log from 'electron-log';
import type { Account, Email, OooSettings, OooLog, OutboxItem } from '../types/index.js';

let db: Database.Database | null = null;

export function initDatabase(): Database.Database {
  if (db) return db;

  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'bizmail.db');

  log.info('Initializing database at:', dbPath);

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();

  log.info('Database initialized');
  return db;
}

function createTables() {
  if (!db) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      imap_host TEXT NOT NULL,
      imap_port INTEGER NOT NULL DEFAULT 993,
      smtp_host TEXT NOT NULL,
      smtp_port INTEGER NOT NULL DEFAULT 587,
      total_storage INTEGER DEFAULT 0,
      used_storage INTEGER DEFAULT 0,
      color_tag TEXT DEFAULT '#3b82f6',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS emails (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      uid INTEGER NOT NULL,
      sender TEXT NOT NULL,
      recipients TEXT,
      subject TEXT,
      body_text TEXT,
      body_html TEXT,
      date_received TEXT NOT NULL,
      folder_type TEXT DEFAULT 'inbox',
      is_read INTEGER DEFAULT 0,
      attachments TEXT,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      UNIQUE(account_id, uid, folder_type)
    );

    CREATE INDEX IF NOT EXISTS idx_emails_account ON emails(account_id);
    CREATE INDEX IF NOT EXISTS idx_emails_date ON emails(date_received);
    CREATE INDEX IF NOT EXISTS idx_emails_folder ON emails(folder_type);

    CREATE TABLE IF NOT EXISTS ooo_settings (
      id TEXT PRIMARY KEY,
      account_id TEXT UNIQUE NOT NULL,
      is_enabled INTEGER DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      message TEXT,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ooo_logs (
      id TEXT PRIMARY KEY,
      email_address TEXT NOT NULL,
      last_reply_date TEXT NOT NULL,
      UNIQUE(email_address)
    );

    CREATE TABLE IF NOT EXISTS outbox (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      cc_address TEXT,
      bcc_address TEXT,
      subject TEXT,
      body_text TEXT,
      body_html TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      sent_at TEXT,
      error_message TEXT,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox(status);
  `);
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    log.info('Database closed');
  }
}

export function getAllAccounts(): Account[] {
  const database = getDatabase();
  return database.prepare('SELECT * FROM accounts ORDER BY email').all() as Account[];
}

export function getAccountById(id: string): Account | undefined {
  const database = getDatabase();
  return database.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as Account | undefined;
}

export function createAccount(account: Account): void {
  const database = getDatabase();
  const stmt = database.prepare(`
    INSERT INTO accounts (id, email, name, imap_host, imap_port, smtp_host, smtp_port, total_storage, used_storage, color_tag)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    account.id,
    account.email,
    account.name,
    account.imap_host,
    account.imap_port,
    account.smtp_host,
    account.smtp_port,
    account.total_storage,
    account.used_storage,
    account.color_tag
  );
  log.info('Account created:', account.email);
}

export function updateAccount(id: string, updates: Partial<Account>): void {
  const database = getDatabase();
  const fields = Object.keys(updates).filter(k => k !== 'id');
  const values = fields.map(k => (updates as any)[k]);
  
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const stmt = database.prepare(`UPDATE accounts SET ${setClause}, updated_at = datetime('now') WHERE id = ?`);
  stmt.run(...values, id);
  log.info('Account updated:', id);
}

export function deleteAccount(id: string): void {
  const database = getDatabase();
  database.prepare('DELETE FROM accounts WHERE id = ?').run(id);
  log.info('Account deleted:', id);
}

export function getEmailsByAccount(accountId: string, folder?: string, limit = 100): Email[] {
  const database = getDatabase();
  if (folder) {
    return database.prepare('SELECT * FROM emails WHERE account_id = ? AND folder_type = ? ORDER BY date_received DESC LIMIT ?')
      .all(accountId, folder, limit) as Email[];
  }
  return database.prepare('SELECT * FROM emails WHERE account_id = ? ORDER BY date_received DESC LIMIT ?')
    .all(accountId, limit) as Email[];
}

export function getAllEmails(limit = 100): Email[] {
  const database = getDatabase();
  return database.prepare(`
    SELECT e.*, a.email as account_email, a.color_tag as account_color 
    FROM emails e 
    JOIN accounts a ON e.account_id = a.id 
    ORDER BY e.date_received DESC 
    LIMIT ?
  `).all(limit) as Email[];
}

export function getEmailById(id: string): Email | undefined {
  const database = getDatabase();
  return database.prepare('SELECT * FROM emails WHERE id = ?').get(id) as Email | undefined;
}

export function insertEmail(email: Email): void {
  const database = getDatabase();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO emails (id, account_id, uid, sender, recipients, subject, body_text, body_html, date_received, folder_type, is_read, attachments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    email.id,
    email.account_id,
    email.uid,
    email.sender,
    email.recipients,
    email.subject,
    email.body_text,
    email.body_html,
    email.date_received,
    email.folder_type,
    email.is_read ? 1 : 0,
    email.attachments
  );
}

export function markEmailAsRead(id: string): void {
  const database = getDatabase();
  database.prepare('UPDATE emails SET is_read = 1 WHERE id = ?').run(id);
}

export function deleteOldEmails(daysOld: number): number {
  const database = getDatabase();
  const result = database.prepare(`
    DELETE FROM emails WHERE date_received < datetime('now', '-' || ? || ' days')
  `).run(daysOld);
  log.info(`Deleted ${result.changes} emails older than ${daysOld} days`);
  return result.changes;
}

export function getOooSettings(accountId: string): OooSettings | undefined {
  const database = getDatabase();
  return database.prepare('SELECT * FROM ooo_settings WHERE account_id = ?').get(accountId) as OooSettings | undefined;
}

export function saveOooSettings(settings: OooSettings): void {
  const database = getDatabase();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO ooo_settings (id, account_id, is_enabled, start_date, end_date, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(settings.id, settings.account_id, settings.is_enabled ? 1 : 0, settings.start_date, settings.end_date, settings.message);
  log.info('OOO settings saved for account:', settings.account_id);
}

export function getOooLog(emailAddress: string): OooLog | undefined {
  const database = getDatabase();
  return database.prepare('SELECT * FROM ooo_logs WHERE email_address = ?').get(emailAddress) as OooLog | undefined;
}

export function saveOooLog(logEntry: OooLog): void {
  const database = getDatabase();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO ooo_logs (id, email_address, last_reply_date)
    VALUES (?, ?, ?)
  `);
  stmt.run(logEntry.id, logEntry.email_address, logEntry.last_reply_date);
}

export function canSendOooAutoReply(emailAddress: string): boolean {
  const logEntry = getOooLog(emailAddress);
  if (!logEntry) return true;
  
  const lastReply = new Date(logEntry.last_reply_date);
  const now = new Date();
  const hoursSinceLastReply = (now.getTime() - lastReply.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceLastReply >= 24;
}

export function getPendingOutboxItems(): OutboxItem[] {
  const database = getDatabase();
  return database.prepare("SELECT * FROM outbox WHERE status = 'pending' ORDER BY created_at").all() as OutboxItem[];
}

export function getAllOutboxItems(): OutboxItem[] {
  const database = getDatabase();
  return database.prepare('SELECT * FROM outbox ORDER BY created_at DESC').all() as OutboxItem[];
}

export function createOutboxItem(item: OutboxItem): void {
  const database = getDatabase();
  const stmt = database.prepare(`
    INSERT INTO outbox (id, account_id, from_address, to_address, cc_address, bcc_address, subject, body_text, body_html, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `);
  stmt.run(
    item.id,
    item.account_id,
    item.from,
    item.to,
    item.cc,
    item.bcc,
    item.subject,
    item.body_text,
    item.body_html
  );
  log.info('Outbox item created:', item.id);
}

export function updateOutboxStatus(id: string, status: 'pending' | 'sent' | 'failed', errorMessage?: string): void {
  const database = getDatabase();
  if (status === 'sent') {
    database.prepare("UPDATE outbox SET status = 'sent', sent_at = datetime('now'), error_message = ? WHERE id = ?")
      .run(errorMessage || null, id);
  } else if (status === 'failed') {
    database.prepare("UPDATE outbox SET status = 'failed', error_message = ? WHERE id = ?")
      .run(errorMessage || 'Unknown error', id);
  } else {
    database.prepare("UPDATE outbox SET status = 'pending', error_message = NULL WHERE id = ?").run(id);
  }
  log.info('Outbox item updated:', id, status);
}

export function deleteOutboxItem(id: string): void {
  const database = getDatabase();
  database.prepare('DELETE FROM outbox WHERE id = ?').run(id);
  log.info('Outbox item deleted:', id);
}

export function updateAccountStorage(accountId: string, usedStorage: number): void {
  const database = getDatabase();
  database.prepare('UPDATE accounts SET used_storage = ?, updated_at = datetime("now") WHERE id = ?')
    .run(usedStorage, accountId);
}

export function getAccountStorageUsage(accountId: string): { used: number; total: number } | undefined {
  const database = getDatabase();
  const account = database.prepare('SELECT used_storage, total_storage FROM accounts WHERE id = ?').get(accountId) as { used_storage: number; total_storage: number } | undefined;
  if (account) {
    return { used: account.used_storage, total: account.total_storage };
  }
  return undefined;
}