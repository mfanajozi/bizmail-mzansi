"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Email {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  preview: string;
  read: boolean;
  hasAttachments: boolean;
  body?: string;
}

export interface Account {
  id: string;
  email: string;
  name: string;
  colorTag: string;
  totalStorage: number;
  usedStorage: number;
  lastSync?: string;
}

interface AccountState {
  accounts: Account[];
  activeAccountId: string | null;
  emails: Email[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  setAccount: (account: Account) => void;
  setActiveAccount: (id: string | null) => void;
  setEmails: (emails: Email[]) => void;
  addEmails: (emails: Email[]) => void;
  markEmailRead: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setError: (error: string | null) => void;
  updateStorage: (used: number) => void;
  clearError: () => void;
  logout: () => void;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      accounts: [],
      activeAccountId: null,
      emails: [],
      isLoading: false,
      isSyncing: false,
      error: null,

      setAccount: (account) => {
        const { accounts } = get();
        const existing = accounts.find((a) => a.id === account.id);
        if (existing) {
          set({ accounts: accounts.map((a) => (a.id === account.id ? account : a)) });
        } else {
          set({ accounts: [...accounts, account], activeAccountId: account.id });
        }
      },

      setActiveAccount: (id) => set({ activeAccountId: id }),

      setEmails: (emails) => set({ emails }),

      addEmails: (newEmails) => {
        const { emails } = get();
        const existingIds = new Set(emails.map((e) => e.id));
        const uniqueNew = newEmails.filter((e) => !existingIds.has(e.id));
        set({ emails: [...uniqueNew, ...emails] });
      },

      markEmailRead: (id) => {
        const { emails } = get();
        set({
          emails: emails.map((e) => (e.id === id ? { ...e, read: true } : e)),
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setSyncing: (isSyncing) => set({ isSyncing }),

      setError: (error) => set({ error }),

      updateStorage: (used) => {
        const { accounts, activeAccountId } = get();
        if (!activeAccountId) return;
        set({
          accounts: accounts.map((a) =>
            a.id === activeAccountId ? { ...a, usedStorage: used, lastSync: new Date().toISOString() } : a
          ),
        });
      },

      clearError: () => set({ error: null }),

      logout: () => set({ 
        accounts: [], 
        activeAccountId: null, 
        emails: [] 
      }),
    }),
    {
      name: "mzansi-mail-storage",
      partialize: (state) => ({
        accounts: state.accounts,
        activeAccountId: state.activeAccountId,
        emails: state.emails,
      }),
    }
  )
);