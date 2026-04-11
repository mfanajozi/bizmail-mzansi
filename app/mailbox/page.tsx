"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAccountStore, Email, FullEmail } from "@/store/accountStore";

// Lazy-load the rich editor so it doesn't block initial render
const RichTextEditor = dynamic(() => import("@/components/editor/RichTextEditor"), {
  ssr: false,
  loading: () => <div className="flex-1 bg-white animate-pulse" />,
});

// ─── helpers ────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  green: "bg-green-600",
  yellow: "bg-amber-500",
  blue: "bg-blue-600",
  red: "bg-red-600",
  purple: "bg-purple-600",
  orange: "bg-orange-500",
};

const FOLDER_ICONS: Record<string, string> = {
  INBOX: "inbox",
  Sent: "send",
  Drafts: "draft",
  Trash: "delete",
  Junk: "warning",
  Spam: "warning",
  Archive: "archive",
};

function FolderIcon({ name }: { name: string }) {
  const key = FOLDER_ICONS[name] || "folder";
  const paths: Record<string, React.ReactNode> = {
    inbox: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m13 0l-3 3m0 0l-3-3" />,
    send: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />,
    draft: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
    delete: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
    warning: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
    archive: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />,
    folder: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />,
  };
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {paths[key]}
    </svg>
  );
}

function SenderAvatar({ name, email, size = "sm" }: { name: string; email: string; size?: "sm" | "md" | "lg" }) {
  const letter = (name || email || "?")[0].toUpperCase();
  const colors = ["bg-blue-500","bg-indigo-500","bg-violet-500","bg-pink-500","bg-rose-500","bg-orange-500","bg-amber-500","bg-teal-500","bg-cyan-500","bg-green-600"];
  const idx = email.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  const sz = size === "lg" ? "w-10 h-10 text-base" : size === "md" ? "w-8 h-8 text-sm" : "w-7 h-7 text-xs";
  return (
    <div className={`${sz} ${colors[idx]} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
      {letter}
    </div>
  );
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  }
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "2-digit" });
}

function formatSize(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getSenderName(from: string): string {
  // "Display Name" <email@host> or Display Name <email@host>
  const withBracket = from.match(/^"?(.+?)"?\s*<[^>]+>$/);
  if (withBracket) return withBracket[1].trim();
  // Plain address only
  return from.includes("@") ? from.split("@")[0] : from;
}

// ─── settings panel ──────────────────────────────────────────────────────────

function SettingsPanel({
  accountId,
  onClose,
}: {
  accountId: string;
  onClose: () => void;
}) {
  const { savedAccounts, updateSavedAccount } = useAccountStore();
  const account = savedAccounts.find((a) => a.id === accountId);
  const [displayName, setDisplayName] = useState(account?.displayName || account?.name || "");
  const [signature, setSignature] = useState(account?.signature || "");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSavedAccount(accountId, { displayName, signature });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-900 text-lg">Account Settings</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Account info (read-only) */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <SenderAvatar name={account?.name || ""} email={account?.email || ""} size="lg" />
            <div>
              <p className="font-semibold text-gray-900">{account?.email}</p>
              <p className="text-xs text-gray-400">{account?.imapHost} · {account?.imapPort}</p>
            </div>
          </div>

          {/* Display name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#006B3C] focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">
              Shown as the sender name in outgoing emails.
            </p>
          </div>

          {/* Signature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Signature
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ minHeight: 180 }}>
              <RichTextEditor
                content={signature}
                onChange={setSignature}
                placeholder="Add your signature here..."
                minHeight={140}
                compact
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Appended automatically to new emails.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-[#006B3C] text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            {saved ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved!
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── compose modal ───────────────────────────────────────────────────────────

interface ComposeData {
  to: string;
  cc: string;
  subject: string;
  body: string;
}

function ComposeModal({
  data,
  mode,
  onClose,
  onSend,
  sending,
  error,
}: {
  data: ComposeData;
  mode: "new" | "reply" | "forward";
  onClose: () => void;
  onSend: (data: ComposeData) => void;
  sending: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState(data);
  const [showCc, setShowCc] = useState(!!data.cc);

  useEffect(() => {
    setForm(data);
    setShowCc(!!data.cc);
  }, [data]);

  const update = (key: keyof ComposeData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const titles: Record<string, string> = {
    new: "New Message",
    reply: "Reply",
    forward: "Forward",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: "100%", maxWidth: 680, height: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-800">{titles[mode]}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
              title="Discard"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Fields */}
        <div className="border-b">
          {/* To */}
          <div className="flex items-center px-5 py-2.5 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-14 shrink-0">To</span>
            <input
              type="email"
              value={form.to}
              onChange={(e) => update("to", e.target.value)}
              placeholder="recipient@example.co.za"
              className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none"
              autoFocus={mode === "new" || mode === "forward"}
            />
            {!showCc && (
              <button
                onClick={() => setShowCc(true)}
                className="text-xs text-gray-400 hover:text-gray-600 ml-2 shrink-0"
              >
                Cc
              </button>
            )}
          </div>

          {/* Cc */}
          {showCc && (
            <div className="flex items-center px-5 py-2.5 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-14 shrink-0">Cc</span>
              <input
                type="text"
                value={form.cc}
                onChange={(e) => update("cc", e.target.value)}
                placeholder="cc@example.co.za"
                className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none"
                autoFocus
              />
            </div>
          )}

          {/* Subject */}
          <div className="flex items-center px-5 py-2.5">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-14 shrink-0">Subject</span>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              placeholder="Subject"
              className="flex-1 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none"
              autoFocus={mode === "reply"}
            />
          </div>
        </div>

        {/* Rich editor */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <RichTextEditor
            content={form.body}
            onChange={(html) => update("body", html)}
            placeholder="Write your message..."
            minHeight={200}
            autoFocus={false}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-gray-50 flex items-center justify-between">
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={() => onSend(form)}
              disabled={sending || !form.to || !form.subject}
              className="flex items-center gap-2 px-5 py-2 bg-[#006B3C] text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function MailboxPage() {
  const router = useRouter();
  const {
    currentAccount,
    setCurrentAccount,
    currentFolder,
    setCurrentFolder,
    emails,
    setEmails,
    selectedEmail,
    setSelectedEmail,
    markEmailRead,
    removeEmail,
    isSyncing,
    setSyncing,
    isLoadingEmail,
    setLoadingEmail,
    error,
    setError,
    totalEmails,
    folders,
    setFolders,
    savedAccounts,
    reset,
  } = useAccountStore();

  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<"new" | "reply" | "forward">("new");
  const [composeData, setComposeData] = useState<ComposeData>({
    to: "", cc: "", subject: "", body: "",
  });
  const [composeSending, setComposeSending] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const savedAccount = savedAccounts.find((a) => a.id === currentAccount?.id);
  const signature = savedAccount?.signature || "";

  // ── load session
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCurrentAccount(data.account);
        else router.push("/login");
      })
      .catch(() => router.push("/login"));
  }, []);

  // ── load folders
  useEffect(() => {
    if (!currentAccount) return;
    fetch("/api/folders")
      .then((r) => r.json())
      .then((data) => { if (data.success) setFolders(data.folders); })
      .catch(() => {});
  }, [currentAccount]);

  // ── load emails
  const loadEmails = useCallback(async (folder: string, page = 1) => {
    setSyncing(true);
    setError(null);
    setSelectedEmail(null);
    try {
      const res = await fetch(`/api/emails?folder=${encodeURIComponent(folder)}&page=${page}`);
      const data = await res.json();
      if (data.success) setEmails(data.emails, data.total, data.page);
      else setError(data.error || "Failed to load emails");
    } catch {
      setError("Failed to connect to email server");
    } finally {
      setSyncing(false);
    }
  }, [setSyncing, setError, setSelectedEmail, setEmails]);

  useEffect(() => {
    if (currentAccount) loadEmails(currentFolder, 1);
  }, [currentFolder, currentAccount]);

  // ── open email
  const openEmail = async (email: Email) => {
    setLoadingEmail(true);
    setSelectedEmail(null);
    try {
      const res = await fetch(`/api/email/${email.uid}?folder=${encodeURIComponent(currentFolder)}`);
      const data = await res.json();
      if (data.success) {
        setSelectedEmail(data.email as FullEmail);
        markEmailRead(email.uid);
      } else setError(data.error || "Failed to open email");
    } catch {
      setError("Failed to load email");
    } finally {
      setLoadingEmail(false);
    }
  };

  // ── email actions
  const handleAction = async (action: string, uid?: number) => {
    const targetUid = uid ?? selectedEmail?.uid;
    if (!targetUid) return;
    try {
      await fetch("/api/email/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uids: [targetUid], action, folder: currentFolder }),
      });
      if (action === "delete") { removeEmail(targetUid); setSelectedEmail(null); }
      if (action === "mark-read") markEmailRead(targetUid);
    } catch { setError("Action failed"); }
  };

  // ── compose helpers
  const openCompose = (mode: "new" | "reply" | "forward", seed?: Partial<ComposeData>) => {
    const signatureBlock = signature
      ? `<p></p><p></p><div style="border-top:1px solid #e5e7eb;margin-top:16px;padding-top:16px">${signature}</div>`
      : "<p></p>";

    setComposeMode(mode);
    setComposeData({
      to: seed?.to || "",
      cc: seed?.cc || "",
      subject: seed?.subject || "",
      body: (seed?.body || "") + signatureBlock,
    });
    setComposeOpen(true);
    setComposeError(null);
  };

  const handleReply = () => {
    if (!selectedEmail) return;
    const quoted = `<blockquote style="border-left:3px solid #d1d5db;padding-left:12px;margin:0;color:#6b7280">${selectedEmail.html || selectedEmail.text?.replace(/\n/g, "<br/>") || ""}</blockquote>`;
    openCompose("reply", {
      to: selectedEmail.fromAddress,
      subject: selectedEmail.subject.startsWith("Re:") ? selectedEmail.subject : `Re: ${selectedEmail.subject}`,
      body: `<p></p><p><strong>On ${new Date(selectedEmail.date).toLocaleString("en-ZA")}, ${selectedEmail.from} wrote:</strong></p>${quoted}`,
    });
  };

  const handleForward = () => {
    if (!selectedEmail) return;
    openCompose("forward", {
      subject: selectedEmail.subject.startsWith("Fwd:") ? selectedEmail.subject : `Fwd: ${selectedEmail.subject}`,
      body: `<p></p><hr/><p><strong>Forwarded Message</strong><br/><strong>From:</strong> ${selectedEmail.from}<br/><strong>Date:</strong> ${new Date(selectedEmail.date).toLocaleString("en-ZA")}<br/><strong>Subject:</strong> ${selectedEmail.subject}</p><p></p>${selectedEmail.html || selectedEmail.text?.replace(/\n/g, "<br/>") || ""}`,
    });
  };

  const handleSend = async (form: ComposeData) => {
    setComposeSending(true);
    setComposeError(null);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: form.to, cc: form.cc || undefined, subject: form.subject, body: form.body }),
      });
      const data = await res.json();
      if (data.success) {
        setComposeOpen(false);
      } else {
        setComposeError(data.error || "Failed to send");
      }
    } catch {
      setComposeError("Failed to send email");
    } finally {
      setComposeSending(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    reset();
    // Hard redirect so the browser re-requests /login with the cleared cookie,
    // bypassing Next.js router cache which might still see the old session.
    window.location.href = "/login";
  };

  const filteredEmails = emails.filter(
    (e) =>
      !search ||
      e.subject.toLowerCase().includes(search.toLowerCase()) ||
      e.from.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = emails.filter((e) => !e.read).length;
  const accentColor = currentAccount ? (COLOR_MAP[currentAccount.colorTag] || "bg-gray-500") : "bg-gray-500";

  const folderList = folders.length > 0 ? folders : [
    { name: "INBOX", path: "INBOX" },
    { name: "Sent", path: "Sent" },
    { name: "Drafts", path: "Drafts" },
    { name: "Trash", path: "Trash" },
    { name: "Junk", path: "Junk" },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden select-none">

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <header className="h-11 bg-[#18202a] flex items-center px-4 gap-3 shrink-0 z-20 border-b border-white/5">
        <button
          className="md:hidden p-1 rounded hover:bg-white/10 text-white/60"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5 mr-3">
          <div className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-4 h-4">
              <rect x="4" y="8" width="32" height="24" rx="3" fill="#006B3C" />
              <path d="M4 12 L20 24 L36 12" stroke="#FFB612" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-white/80 font-semibold text-sm hidden sm:block tracking-tight">BizMail</span>
        </div>

        <div className="flex-1 max-w-sm">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full bg-white/8 text-white/80 placeholder-white/30 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:bg-white/15 border border-white/10 focus:border-white/25 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {currentAccount && (
            <span className="text-white/40 text-xs hidden lg:block truncate max-w-[160px]">
              {currentAccount.email}
            </span>
          )}
          {currentAccount && (
            <div className={`w-7 h-7 rounded-full ${accentColor} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
              {(savedAccount?.displayName || currentAccount.email)[0].toUpperCase()}
            </div>
          )}
        </div>
      </header>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
        <aside className={`
          ${showSidebar ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          absolute md:relative z-30 md:z-0
          w-52 h-full flex flex-col bg-[#1e2a35] shrink-0
          transition-transform duration-200
        `}>
          <div className="p-3">
            <button
              onClick={() => {
                openCompose("new");
                setShowSidebar(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#006B3C] hover:bg-[#005a32] text-white font-medium py-2 rounded-lg transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Compose
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2">
            <p className="text-white/25 text-[10px] uppercase tracking-widest px-2 pt-2 pb-1 font-medium">Mailboxes</p>
            {folderList.map((folder) => {
              const isActive = currentFolder === folder.path;
              return (
                <button
                  key={folder.path}
                  onClick={() => { setCurrentFolder(folder.path); setShowSidebar(false); }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all mb-px ${
                    isActive
                      ? "bg-white/12 text-white"
                      : "text-white/55 hover:bg-white/7 hover:text-white/80"
                  }`}
                >
                  <FolderIcon name={folder.name} />
                  <span className="flex-1 text-left truncate">{folder.name}</span>
                  {folder.name === "INBOX" && unreadCount > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-[#006B3C] text-white" : "bg-white/15 text-white/70"
                    }`}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom: account + settings + logout */}
          <div className="p-3 border-t border-white/8 space-y-1">
            {currentAccount && (
              <div className="flex items-center gap-2 px-2 py-2">
                <div className={`w-7 h-7 rounded-full ${accentColor} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                  {(savedAccount?.displayName || currentAccount.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-xs font-medium truncate">
                    {savedAccount?.displayName || currentAccount.name}
                  </p>
                  <p className="text-white/35 text-[10px] truncate">{currentAccount.email}</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/7 text-xs transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings &amp; Signature
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 text-xs transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Sidebar overlay mobile */}
        {showSidebar && (
          <div className="md:hidden absolute inset-0 bg-black/50 z-20" onClick={() => setShowSidebar(false)} />
        )}

        {/* ── EMAIL LIST ──────────────────────────────────────────────── */}
        <div className={`
          w-full sm:w-72 md:w-80 lg:w-[340px] xl:w-96 shrink-0
          flex flex-col bg-white border-r border-gray-150
          ${selectedEmail || isLoadingEmail ? "hidden sm:flex" : "flex"}
        `}>
          {/* List toolbar */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 text-[13px]">{currentFolder}</h2>
              {totalEmails > 0 && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {totalEmails.toLocaleString()} messages{unreadCount > 0 ? ` · ${unreadCount} unread` : ""}
                </p>
              )}
            </div>
            <button
              onClick={() => loadEmails(currentFolder, 1)}
              disabled={isSyncing}
              title="Refresh"
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors"
            >
              <svg className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Email rows */}
          <div className="flex-1 overflow-y-auto">
            {isSyncing && emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <svg className="w-6 h-6 text-[#006B3C] animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-gray-400 text-xs">Loading…</p>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                <svg className="w-10 h-10 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
                </svg>
                <p className="text-gray-400 text-sm font-medium">
                  {search ? "No results" : "No emails"}
                </p>
              </div>
            ) : (
              filteredEmails.map((email) => {
                const isSelected = selectedEmail?.uid === email.uid;
                const senderName = getSenderName(email.from);
                return (
                  <button
                    key={email.uid}
                    onClick={() => openEmail(email)}
                    className={`w-full text-left px-4 py-3.5 border-b border-gray-100/80 hover:bg-gray-50 transition-colors relative group ${
                      isSelected ? "bg-green-50 border-l-2 border-l-[#006B3C]" : ""
                    }`}
                  >
                    {/* Unread accent bar */}
                    {!email.read && !isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#006B3C] rounded-r" />
                    )}

                    <div className="flex items-start gap-3">
                      <SenderAvatar name={senderName} email={email.fromAddress} size="sm" />

                      <div className="flex-1 min-w-0">
                        {/* Row 1: sender + date */}
                        <div className="flex items-baseline justify-between gap-2 mb-0.5">
                          <span className={`text-[13px] truncate ${!email.read ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                            {senderName}
                          </span>
                          <span className={`text-[11px] shrink-0 ${!email.read ? "text-[#006B3C] font-medium" : "text-gray-400"}`}>
                            {formatDate(email.date)}
                          </span>
                        </div>

                        {/* Row 2: subject */}
                        <p className={`text-xs truncate ${!email.read ? "font-medium text-gray-800" : "text-gray-600"}`}>
                          {email.subject}
                        </p>

                        {/* Row 3: badges */}
                        {(email.hasAttachments || email.flagged) && (
                          <div className="flex items-center gap-1.5 mt-1">
                            {email.hasAttachments && (
                              <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                Attachment
                              </span>
                            )}
                            {email.flagged && (
                              <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M3 3v18l9-4.5L21 21V3H3z" />
                                </svg>
                                Starred
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-2.5 bg-red-50 border-t border-red-100 flex items-center justify-between">
              <p className="text-red-600 text-xs">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2 p-0.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* ── EMAIL PREVIEW ────────────────────────────────────────────── */}
        <div className={`
          flex-1 flex flex-col min-w-0 bg-gray-50
          ${selectedEmail || isLoadingEmail ? "flex" : "hidden sm:flex"}
        `}>
          {isLoadingEmail ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <svg className="w-8 h-8 text-[#006B3C] animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-gray-400 text-sm">Opening email…</p>
              </div>
            </div>
          ) : selectedEmail ? (
            <div className="flex flex-col h-full">
              {/* Email action toolbar */}
              <div className="px-5 py-2.5 border-b border-gray-200 flex items-center gap-2 bg-white shrink-0">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="sm:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 mr-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={handleReply}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006B3C] text-white text-xs font-semibold rounded-lg hover:bg-[#005a32] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Reply
                </button>

                <button
                  onClick={handleForward}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" />
                  </svg>
                  Forward
                </button>

                <div className="flex-1" />

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAction("mark-unread")}
                    title="Mark unread"
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleAction("flag")}
                    title="Flag"
                    className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18l9-4.5L21 21V3H3z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleAction("delete")}
                    title="Delete"
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Email header card */}
              <div className="px-6 py-5 border-b border-gray-200 bg-white shrink-0">
                <h1 className="text-lg font-bold text-gray-900 mb-4 leading-snug">
                  {selectedEmail.subject}
                </h1>
                <div className="flex items-center gap-3">
                  <SenderAvatar
                    name={getSenderName(selectedEmail.from)}
                    email={selectedEmail.fromAddress}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-semibold text-gray-900 text-sm truncate">{selectedEmail.from}</p>
                      <time className="text-xs text-gray-400 shrink-0">
                        {new Date(selectedEmail.date).toLocaleString("en-ZA", {
                          weekday: "short", day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      To: <span className="text-gray-600">{selectedEmail.to}</span>
                    </p>
                    {selectedEmail.cc && (
                      <p className="text-xs text-gray-500">
                        Cc: <span className="text-gray-600">{selectedEmail.cc}</span>
                      </p>
                    )}
                  </div>
                </div>

                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedEmail.attachments.map((att, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 border border-gray-200">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="font-medium">{att.filename || "attachment"}</span>
                        <span className="text-gray-400">{formatSize(att.size)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Email body */}
              <div className="flex-1 overflow-auto bg-white">
                {selectedEmail.html ? (
                  <iframe
                    ref={iframeRef}
                    srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><base target="_blank"/><style>*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.65;color:#1a1a1a;padding:24px 32px;margin:0;max-width:680px}img{max-width:100%;height:auto}a{color:#006B3C}table{border-collapse:collapse;max-width:100%}blockquote{border-left:3px solid #e5e7eb;margin:0 0 16px;padding-left:16px;color:#6b7280}pre,code{font-family:monospace;font-size:13px;background:#f3f4f6;padding:2px 4px;border-radius:4px}</style></head><body>${selectedEmail.html}</body></html>`}
                    className="w-full h-full border-0"
                    sandbox="allow-popups allow-same-origin"
                    title="Email content"
                    onLoad={(e) => {
                      const iframe = e.currentTarget;
                      const body = iframe.contentDocument?.body;
                      if (body) {
                        const height = body.scrollHeight;
                        iframe.style.height = `${height + 48}px`;
                      }
                    }}
                  />
                ) : (
                  <div className="px-8 py-6">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                      {selectedEmail.text || "(No content)"}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-400 font-medium text-sm">Select an email to read</p>
              <button
                onClick={() => openCompose("new")}
                className="mt-6 flex items-center gap-2 px-4 py-2 bg-[#006B3C] text-white text-sm font-medium rounded-lg hover:bg-[#005a32] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Compose New Email
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS ───────────────────────────────────────────────────────── */}

      {showSettings && currentAccount && (
        <SettingsPanel
          accountId={currentAccount.id}
          onClose={() => setShowSettings(false)}
        />
      )}

      {composeOpen && (
        <ComposeModal
          data={composeData}
          mode={composeMode}
          onClose={() => setComposeOpen(false)}
          onSend={handleSend}
          sending={composeSending}
          error={composeError}
        />
      )}
    </div>
  );
}
