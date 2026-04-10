import { ImapFlow } from 'imapflow';
import log from 'electron-log';
import { v4 as uuidv4 } from 'uuid';
import { 
  getEmailsByAccount, 
  insertEmail, 
  deleteOldEmails, 
  updateAccountStorage,
  getOooSettings,
  canSendOooAutoReply,
  saveOooLog
} from './DatabaseService.js';
import { getPassword } from './SecurityService.js';
import type { Account, Email, OooSettings } from '../types/index.js';

const SYNC_WINDOW_DAYS = 30;
const MAX_EMAILS_PER_SYNC = 500;

export class SyncService {
  private syncingAccounts: Map<string, boolean> = new Map();
  private syncListeners: Map<string, Function[]> = new Map();

  async syncAccount(account: Account): Promise<{ success: boolean; synced: number; error?: string }> {
    if (this.syncingAccounts.get(account.id)) {
      log.warn('Sync already in progress for account:', account.id);
      return { success: false, synced: 0, error: 'Sync already in progress' };
    }

    this.syncingAccounts.set(account.id, true);
    this.notifyListeners(account.id, { isRunning: true, progress: 0 });

    let client: ImapFlow | null = null;

    try {
      const password = getPassword(account.id);
      if (!password) {
        throw new Error('Password not found in vault');
      }

      client = new ImapFlow({
        host: account.imap_host,
        port: account.imap_port,
        secure: account.imap_port === 993,
        auth: {
          user: account.email,
          pass: password
        },
        logger: log
      });

      await client.connect();
      log.info('Connected to IMAP for:', account.email);

      let syncedCount = 0;

      const folders: { name: string; type: 'inbox' | 'sent' }[] = [
        { name: 'INBOX', type: 'inbox' },
        { name: 'Sent', type: 'sent' }
      ];

      for (const folder of folders) {
        const lock = await client.getMailboxLock(folder.name);
        
        try {
          const existingUids = new Set(
            getEmailsByAccount(account.id, folder.type)
              .map(e => e.uid)
          );

          const sinceDate = new Date();
          sinceDate.setDate(sinceDate.getDate() - SYNC_WINDOW_DAYS);

          const messages = client.fetch(
            {
              since: sinceDate.toISOString(),
            },
            {
              envelope: true,
              body: true,
              structure: true,
              internalDate: true
            }
          );

          for await (const msg of messages) {
            if (existingUids.has(msg.uid)) {
              continue;
            }

            const sender = msg.envelope?.from?.[0]?.address || '';
            const recipients = msg.envelope?.to?.map(t => t.address).join(', ') || '';
            
            const email: Email = {
              id: uuidv4(),
              account_id: account.id,
              uid: msg.uid,
              sender: sender,
              recipients: recipients,
              subject: msg.envelope?.subject || '',
              body_text: this.extractTextBody(msg),
              body_html: this.extractHtmlBody(msg),
              date_received: msg.internalDate ? new Date(msg.internalDate).toISOString() : new Date().toISOString(),
              folder_type: folder.type,
              is_read: false,
              attachments: '[]'
            };

            insertEmail(email);
            syncedCount++;
          }
        } finally {
          lock.release();
        }
      }

      await this.updateQuota(client, account);
      
      await this.checkAndSendOooAutoReplies(client, account);

      await client.logout();
      client = null;

      deleteOldEmails(SYNC_WINDOW_DAYS);

      const synced = syncedCount;
      this.notifyListeners(account.id, { 
        isRunning: false, 
        progress: 100, 
        lastSync: new Date().toISOString(),
        synced
      });

      log.info(`Sync completed for ${account.email}: ${syncedCount} new emails`);

      this.syncingAccounts.set(account.id, false);
      return { success: true, synced: syncedCount };

    } catch (error: any) {
      log.error('Sync failed for account:', account.id, error);
      this.syncingAccounts.set(account.id, false);
      
      this.notifyListeners(account.id, { 
        isRunning: false, 
        error: error.message 
      });

      if (client) {
        try { await client.logout(); } catch {}
      }

      return { success: false, synced: 0, error: error.message };
    }
  }

  private extractTextBody(msg: any): string {
    if (!msg.body) return '';
    if (typeof msg.body === 'string') return msg.body;
    return msg.body?.text || '';
  }

  private extractHtmlBody(msg: any): string {
    if (!msg.body) return '';
    if (typeof msg.body === 'string') {
      return msg.body.includes('<html') ? msg.body : '';
    }
    return msg.body?.html || '';
  }

  private async updateQuota(client: ImapFlow, account: Account): Promise<void> {
    try {
      const quota = await client.getQuota();
      if (quota && typeof quota.used === 'number') {
        updateAccountStorage(account.id, quota.used / (1024 * 1024));
        log.info('Quota updated for account:', account.email);
      }
    } catch (error) {
      log.warn('Failed to get quota for account:', account.email, error);
    }
  }

  private async checkAndSendOooAutoReplies(client: ImapFlow, account: Account): Promise<void> {
    const settings = getOooSettings(account.id);
    if (!settings || !settings.is_enabled) {
      return;
    }

    const now = new Date();
    const start = new Date(settings.start_date);
    const end = new Date(settings.end_date);

    if (now >= start && now <= end) {
      const lock = await client.getMailboxLock('INBOX');
      
      try {
        const messages = client.fetch(
          { unseen: true },
          { envelope: true }
        );

        for await (const msg of messages) {
          const senderEmail = msg.envelope?.from?.[0]?.address;
          if (!senderEmail) continue;

          if (!canSendOooAutoReply(senderEmail)) {
            continue;
          }

          await this.sendOooAutoReply(client, senderEmail, settings.message, account.email);

          const logEntry = {
            id: uuidv4(),
            email_address: senderEmail,
            last_reply_date: new Date().toISOString()
          };
          saveOooLog(logEntry);
        }
      } finally {
        lock.release();
      }
    }
  }

  private async sendOooAutoReply(
    client: ImapFlow, 
    recipientEmail: string, 
    message: string,
    fromEmail: string
  ): Promise<void> {
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: '127.0.0.1',
      port: 25,
      ignoreTLS: true
    });

    try {
      await transporter.sendMail({
        from: fromEmail,
        to: recipientEmail,
        subject: 'Out of Office',
        text: message
      });
      log.info('OOO auto-reply sent to:', recipientEmail);
    } catch {}
  }

  isSyncing(accountId: string): boolean {
    return this.syncingAccounts.get(accountId) || false;
  }

  onSyncProgress(accountId: string, callback: Function): void {
    if (!this.syncListeners.has(accountId)) {
      this.syncListeners.set(accountId, []);
    }
    this.syncListeners.get(accountId)!.push(callback);
  }

  removeSyncProgressListener(accountId: string, callback: Function): void {
    const listeners = this.syncListeners.get(accountId);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private notifyListeners(accountId: string, status: any): void {
    const listeners = this.syncListeners.get(accountId);
    if (listeners) {
      listeners.forEach(cb => cb(status));
    }
  }
}

export const syncService = new SyncService();