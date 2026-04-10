export interface Account {
  id: string;
  email: string;
  name: string;
  imap_host: string;
  imap_port: number;
  smtp_host: string;
  smtp_port: number;
  total_storage: number;
  used_storage: number;
  color_tag: string;
  created_at: string;
  updated_at: string;
}

export interface Email {
  id: string;
  account_id: string;
  uid: number;
  sender: string;
  recipients: string;
  subject: string;
  body_text: string;
  body_html: string;
  date_received: string;
  folder_type: 'inbox' | 'sent';
  is_read: boolean;
  attachments: string;
}

export interface OooSettings {
  id?: string;
  account_id: string;
  is_enabled: boolean;
  start_date: string;
  end_date: string;
  message: string;
}

export interface OooLog {
  id: string;
  email_address: string;
  last_reply_date: string;
}

export interface OutboxItem {
  id: string;
  account_id: string;
  from: string;
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body_text: string;
  body_html: string;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
  sent_at: string | null;
  error_message: string | null;
}

export interface SyncStatus {
  accountId: string;
  isRunning: boolean;
  lastSync: string | null;
  error: string | null;
  progress: number;
  totalEmails: number;
  syncedEmails: number;
}

export interface MailConfig {
  email: string;
  password: string;
  imap_host: string;
  imap_port: number;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
}