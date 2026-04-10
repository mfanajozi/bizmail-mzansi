import nodemailer from 'nodemailer';
import log from 'electron-log';
import { v4 as uuidv4 } from 'uuid';
import { 
  getPendingOutboxItems,
  updateOutboxStatus,
  createOutboxItem,
  getAccountById
} from './DatabaseService.js';
import { getPassword, wipePasswordFromMemory } from './SecurityService.js';
import type { OutboxItem } from '../types/index.js';

export class OutboxService {
  private processing = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start(intervalMs = 30000): void {
    if (this.intervalId) {
      return;
    }
    
    this.intervalId = setInterval(() => {
      this.processQueue();
    }, intervalMs);

    log.info('Outbox service started');
    
    this.processQueue();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      log.info('Outbox service stopped');
    }
  }

  async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      const items = getPendingOutboxItems();
      
      for (const item of items) {
        await this.sendItem(item);
      }
    } catch (error) {
      log.error('Outbox processing error:', error);
    } finally {
      this.processing = false;
    }
  }

  private async sendItem(item: OutboxItem): Promise<void> {
    const account = getAccountById(item.account_id);
    if (!account) {
      updateOutboxStatus(item.id, 'failed', 'Account not found');
      return;
    }

    const password = getPassword(account.id);
    if (!password) {
      updateOutboxStatus(item.id, 'failed', 'Password not found');
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: account.smtp_host,
        port: account.smtp_port,
        secure: account.smtp_port === 465,
        auth: {
          user: account.email,
          pass: password
        },
        connectionTimeout: 30000
      } as any);

      await transporter.sendMail({
        from: item.from,
        to: item.to,
        cc: item.cc || undefined,
        bcc: item.bcc || undefined,
        subject: item.subject,
        text: item.body_text || undefined,
        html: item.body_html || undefined
      });

      wipePasswordFromMemory(password);

      updateOutboxStatus(item.id, 'sent');
      log.info('Email sent:', item.subject);

    } catch (error: any) {
      updateOutboxStatus(item.id, 'failed', error.message);
      log.error('Failed to send email:', error);
    }
  }

  async sendImmediate(
    accountId: string,
    to: string,
    subject: string,
    bodyText: string,
    bodyHtml?: string,
    cc?: string,
    bcc?: string
  ): Promise<{ success: boolean; error?: string }> {
    const account = getAccountById(accountId);
    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    const password = getPassword(account.id);
    if (!password) {
      return { success: false, error: 'Password not found' };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: account.smtp_host,
        port: account.smtp_port,
        secure: account.smtp_port === 465,
        auth: {
          user: account.email,
          pass: password
        },
        connectionTimeout: 30000
      } as any);

      await transporter.sendMail({
        from: account.email,
        to: to,
        cc: cc || undefined,
        bcc: bcc || undefined,
        subject: subject,
        text: bodyText,
        html: bodyHtml
      });

      wipePasswordFromMemory(password);

      log.info('Immediate email sent:', subject);
      return { success: true };

    } catch (error: any) {
      log.error('Failed to send immediate email:', error);
      return { success: false, error: error.message };
    }
  }

  queueEmail(
    accountId: string,
    from: string,
    to: string,
    subject: string,
    bodyText: string,
    bodyHtml?: string,
    cc?: string,
    bcc?: string
  ): string {
    const item: OutboxItem = {
      id: uuidv4(),
      account_id: accountId,
      from: from,
      to: to,
      cc: cc || '',
      bcc: bcc || '',
      subject: subject,
      body_text: bodyText,
      body_html: bodyHtml || '',
      status: 'pending',
      created_at: new Date().toISOString(),
      sent_at: null,
      error_message: null
    };

    createOutboxItem(item);
    log.info('Email queued:', subject);

    return item.id;
  }
}

export const outboxService = new OutboxService();