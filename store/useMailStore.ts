import { create } from "zustand";

export type Email = {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  date: string;
  accountColor: string;
  body: string;
};

type MailState = {
  emails: Email[];
  selectedEmail: Email | null;
  selectEmail: (email: Email | null) => void;
};

export const useMailStore = create<MailState>((set) => ({
  emails: [
    {
      id: "1",
      sender: "John @ Biz1",
      subject: "Invoice Ready",
      preview: "Your invoice has been generated...",
      date: "10:45",
      accountColor: "bg-green-600",
      body: "<p>Your invoice is ready for download.</p>",
    },
    {
      id: "2",
      sender: "Sarah @ Biz2",
      subject: "Meeting Notes",
      preview: "Here are the notes from today...",
      date: "09:30",
      accountColor: "bg-yellow-500",
      body: "<p>Meeting summary attached.</p>",
    },
  ],
  selectedEmail: null,
  selectEmail: (email) => set({ selectedEmail: email }),
}));