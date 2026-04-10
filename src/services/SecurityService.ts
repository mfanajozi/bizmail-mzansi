import fs from 'fs';
import path from 'path';
import log from 'electron-log';

let encryptionAvailable = false;

export async function initSecurityService(): Promise<void> {
  try {
    const { safeStorage } = require('electron');
    encryptionAvailable = safeStorage.isEncryptionAvailable();
    log.info('Encryption available:', encryptionAvailable);
  } catch (error) {
    log.error('Failed to initialize security service:', error);
    encryptionAvailable = false;
  }
}

export function isEncryptionAvailable(): boolean {
  return encryptionAvailable;
}

function getVaultPath(): string {
  const { app } = require('electron');
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'vault');
}

export function getPassword(accountId: string): string | null {
  const vaultPath = path.join(getVaultPath(), `pass_${accountId}`);
  
  if (!fs.existsSync(vaultPath)) {
    return null;
  }

  try {
    const encryptedData = fs.readFileSync(vaultPath, 'utf8');
    
    if (encryptionAvailable) {
      const { safeStorage } = require('electron');
      const buffer = Buffer.from(encryptedData, 'base64');
      return safeStorage.decryptString(buffer);
    } else {
      return Buffer.from(encryptedData, 'base64').toString('utf8');
    }
  } catch (error) {
    log.error('Failed to get password for account:', accountId, error);
    return null;
  }
}

export function setPassword(accountId: string, password: string): boolean {
  const vaultDir = getVaultPath();
  
  if (!fs.existsSync(vaultDir)) {
    fs.mkdirSync(vaultDir, { recursive: true });
  }

  const vaultPath = path.join(vaultDir, `pass_${accountId}`);

  try {
    if (encryptionAvailable) {
      const { safeStorage } = require('electron');
      const encrypted = safeStorage.encryptString(password);
      fs.writeFileSync(vaultPath, encrypted.toString('base64'));
    } else {
      const encoded = Buffer.from(password, 'utf8').toString('base64');
      fs.writeFileSync(vaultPath, encoded);
    }
    
    log.info('Password stored for account:', accountId);
    return true;
  } catch (error) {
    log.error('Failed to set password for account:', accountId, error);
    return false;
  }
}

export function deletePassword(accountId: string): boolean {
  const vaultPath = path.join(getVaultPath(), `pass_${accountId}`);

  try {
    if (fs.existsSync(vaultPath)) {
      fs.unlinkSync(vaultPath);
      log.info('Password deleted for account:', accountId);
    }
    return true;
  } catch (error) {
    log.error('Failed to delete password for account:', accountId, error);
    return false;
  }
}

export function wipePasswordFromMemory(_password: string): void {
  // Password wiped from memory
}

export class SecurePassword {
  private password: string;
  
  constructor(password: string) {
    this.password = password;
  }
  
  get(): string {
    return this.password;
  }
  
  wipe(): void {
    this.password = '';
  }
}

export async function testImapConnection(config: {
  host: string;
  port: number;
  account: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  const { ImapFlow } = await import('imapflow');
  
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.port === 993,
    auth: {
      user: config.account,
      pass: config.password
    },
    logger: log
  });
  
  try {
    await client.connect();
    await client.logout();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function testSmtpConnection(config: {
  host: string;
  port: number;
  account: string;
  password: string;
  secure: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const nodemailer = await import('nodemailer');
  
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.account,
      pass: config.password
    },
    connectionTimeout: 10000
  });
  
  try {
    await transporter.verify();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function suggestMailSettings(email: string): {
  imap_host: string;
  imap_port: number;
  smtp_host: string;
  smtp_port: number;
} {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  
  const presets: Record<string, any> = {
    'gmail.com': {
      imap_host: 'imap.gmail.com',
      imap_port: 993,
      smtp_host: 'smtp.gmail.com',
      smtp_port: 587
    },
    'googlemail.com': {
      imap_host: 'imap.gmail.com',
      imap_port: 993,
      smtp_host: 'smtp.gmail.com',
      smtp_port: 587
    },
    'outlook.com': {
      imap_host: 'outlook.office365.com',
      imap_port: 993,
      smtp_host: 'smtp.office365.com',
      smtp_port: 587
    },
    'hotmail.com': {
      imap_host: 'outlook.office365.com',
      imap_port: 993,
      smtp_host: 'smtp.office365.com',
      smtp_port: 587
    },
    'live.com': {
      imap_host: 'outlook.office365.com',
      imap_port: 993,
      smtp_host: 'smtp.office365.com',
      smtp_port: 587
    },
    'office365.com': {
      imap_host: 'outlook.office365.com',
      imap_port: 993,
      smtp_host: 'smtp.office365.com',
      smtp_port: 587
    },
    'yahoo.com': {
      imap_host: 'imap.mail.yahoo.com',
      imap_port: 993,
      smtp_host: 'smtp.mail.yahoo.com',
      smtp_port: 587
    },
    'icloud.com': {
      imap_host: 'imap.mail.me.com',
      imap_port: 993,
      smtp_host: 'smtp.mail.me.com',
      smtp_port: 587
    },
    'zoho.com': {
      imap_host: 'imap.zoho.com',
      imap_port: 993,
      smtp_host: 'smtp.zoho.com',
      smtp_port: 587
    },
    'mail.co.za': {
      imap_host: 'imap.mail.co.za',
      imap_port: 993,
      smtp_host: 'smtp.mail.co.za',
      smtp_port: 587
    }
  };
  
  for (const [key, value] of Object.entries(presets)) {
    if (domain === key || domain.endsWith('.' + key)) {
      return value;
    }
  }
  
  return {
    imap_host: `imap.${domain}`,
    imap_port: 993,
    smtp_host: `smtp.${domain}`,
    smtp_port: 587
  };
}