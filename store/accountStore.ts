"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Saved account config (no password) for the login page
export interface SavedAccount {
  id: string;
  email: string;
  name: string;
  colorTag: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  addedAt: string;
}

// Runtime account info from session
export interface AccountInfo {
  id: string;
  email: string;
  name: string;
  colorTag: string;
}

export interface Email {
  uid: number;
  seq?: number;
  subject: string;
  from: string;
  fromAddress: string;
  to: string;
  date: string;
  read: boolean;
  flagged?: boolean;
  hasAttachments: boolean;
  size?: number;
  preview?: string;
  body?: string;
  html?: string;
}

export interface FullEmail {
  uid: number;
  subject: string;
  from: string;
  fromAddress: string;
  to: string;
  date: string;
  read: boolean;
  flagged?: boolean;
  hasAttachments: boolean;
  html: string | null;
  text: string | null;
  cc?: string;
  attachments?: { filename?: string; contentType: string; size: number }[];
  flags?: string[];
}

interface AccountStoreState {
  // Persisted - saved account configs for login page
  savedAccounts: SavedAccount[];

  // Runtime - current session
  currentAccount: AccountInfo | null;
  currentFolder: string;
  emails: Email[];
  selectedEmail: FullEmail | null;
  isSyncing: boolean;
  isLoadingEmail: boolean;
  error: string | null;
  totalEmails: number;
  currentPage: number;
  folders: { name: string; path: string; specialUse?: string | null }[];

  // Saved accounts management
  saveAccount: (account: SavedAccount) => void;
  removeSavedAccount: (id: string) => void;

  // Runtime
  setCurrentAccount: (account: AccountInfo | null) => void;
  setCurrentFolder: (folder: string) => void;
  setEmails: (emails: Email[], total: number, page: number) => void;
  setSelectedEmail: (email: FullEmail | null) => void;
  markEmailRead: (uid: number) => void;
  removeEmail: (uid: number) => void;
  setSyncing: (v: boolean) => void;
  setLoadingEmail: (v: boolean) => void;
  setError: (error: string | null) => void;
  setFolders: (folders: { name: string; path: string; specialUse?: string | null }[]) => void;
  reset: () => void;
}

export const useAccountStore = create<AccountStoreState>()(
  persist(
    (set, get) => ({
      savedAccounts: [],
      currentAccount: null,
      currentFolder: "INBOX",
      emails: [],
      selectedEmail: null,
      isSyncing: false,
      isLoadingEmail: false,
      error: null,
      totalEmails: 0,
      currentPage: 1,
      folders: [],

      saveAccount: (account) => {
        const { savedAccounts } = get();
        const exists = savedAccounts.find((a) => a.id === account.id || a.email === account.email);
        if (exists) {
          set({
            savedAccounts: savedAccounts.map((a) =>
              a.id === account.id || a.email === account.email ? account : a
            ),
          });
        } else {
          set({ savedAccounts: [...savedAccounts, account] });
        }
      },

      removeSavedAccount: (id) => {
        const { savedAccounts } = get();
        set({ savedAccounts: savedAccounts.filter((a) => a.id !== id) });
      },

      setCurrentAccount: (account) => set({ currentAccount: account }),
      setCurrentFolder: (folder) => set({ currentFolder: folder }),

      setEmails: (emails, total, page) =>
        set({ emails, totalEmails: total, currentPage: page }),

      setSelectedEmail: (email) => set({ selectedEmail: email }),

      markEmailRead: (uid) => {
        const { emails } = get();
        set({ emails: emails.map((e) => (e.uid === uid ? { ...e, read: true } : e)) });
      },

      removeEmail: (uid) => {
        const { emails } = get();
        set({ emails: emails.filter((e) => e.uid !== uid) });
      },

      setSyncing: (isSyncing) => set({ isSyncing }),
      setLoadingEmail: (isLoadingEmail) => set({ isLoadingEmail }),
      setError: (error) => set({ error }),
      setFolders: (folders) => set({ folders }),

      reset: () =>
        set({
          currentAccount: null,
          currentFolder: "INBOX",
          emails: [],
          selectedEmail: null,
          isSyncing: false,
          error: null,
          totalEmails: 0,
          currentPage: 1,
          folders: [],
        }),
    }),
    {
      name: "bizmail-accounts",
      partialize: (state) => ({
        savedAccounts: state.savedAccounts,
      }),
    }
  )
);
