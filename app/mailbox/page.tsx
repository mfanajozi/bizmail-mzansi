"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccountStore, Email, FullEmail } from "@/store/accountStore";

const COLOR_MAP: Record<string, string> = {
  green: "bg-green-600",
  yellow: "bg-yellow-500",
  blue: "bg-blue-600",
  red: "bg-red-600",
  purple: "bg-purple-600",
  orange: "bg-orange-500",
};

const FOLDER_ICONS: Record<string, string> = {
  INBOX: "📥",
  Sent: "📤",
  Drafts: "📝",
  Trash: "🗑️",
  Junk: "⚠️",
  Spam: "⚠️",
  Archive: "📦",
  Starred: "⭐",
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const isToday = date.toDateString() === now.toDateString();
  const isThisYear = date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  }
  if (isThisYear) {
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
    currentPage,
    folders,
    setFolders,
    reset,
  } = useAccountStore();

  const [search, setSearch] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [composeData, setComposeData] = useState({ to: "", cc: "", subject: "", body: "", replyTo: "" });
  const [composeSending, setComposeSending] = useState(false);
  const [composeMode, setComposeMode] = useState<"new" | "reply" | "forward">("new");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load session account info on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCurrentAccount(data.account);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"));
  }, []);

  // Load folders
  useEffect(() => {
    if (!currentAccount) return;
    fetch("/api/folders")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setFolders(data.folders);
        }
      })
      .catch(() => {});
  }, [currentAccount]);

  // Load emails when folder changes
  const loadEmails = useCallback(
    async (folder: string, page = 1) => {
      setSyncing(true);
      setError(null);
      setSelectedEmail(null);
      try {
        const res = await fetch(`/api/emails?folder=${encodeURIComponent(folder)}&page=${page}`);
        const data = await res.json();
        if (data.success) {
          setEmails(data.emails, data.total, data.page);
        } else {
          setError(data.error || "Failed to load emails");
        }
      } catch {
        setError("Failed to connect to email server");
      } finally {
        setSyncing(false);
      }
    },
    [setSyncing, setError, setSelectedEmail, setEmails]
  );

  useEffect(() => {
    if (currentAccount) {
      loadEmails(currentFolder, 1);
    }
  }, [currentFolder, currentAccount]);

  // Load full email
  const openEmail = async (email: Email) => {
    setLoadingEmail(true);
    setSelectedEmail(null);

    try {
      const res = await fetch(
        `/api/email/${email.uid}?folder=${encodeURIComponent(currentFolder)}`
      );
      const data = await res.json();
      if (data.success) {
        setSelectedEmail(data.email as FullEmail);
        markEmailRead(email.uid);
      } else {
        setError(data.error || "Failed to open email");
      }
    } catch {
      setError("Failed to load email");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleAction = async (action: string, uid?: number) => {
    const targetUid = uid ?? selectedEmail?.uid;
    if (!targetUid) return;

    try {
      await fetch("/api/email/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uids: [targetUid], action, folder: currentFolder }),
      });

      if (action === "delete") {
        removeEmail(targetUid);
        setSelectedEmail(null);
      } else if (action === "mark-read") {
        markEmailRead(targetUid);
      }
    } catch {
      setError("Action failed");
    }
  };

  const handleReply = () => {
    if (!selectedEmail) return;
    setComposeMode("reply");
    setComposeData({
      to: selectedEmail.fromAddress,
      cc: "",
      subject: selectedEmail.subject.startsWith("Re:")
        ? selectedEmail.subject
        : `Re: ${selectedEmail.subject}`,
      body: `<br/><br/>---<br/><strong>From:</strong> ${selectedEmail.from}<br/><strong>Date:</strong> ${formatDate(selectedEmail.date)}<br/><br/>${selectedEmail.html || selectedEmail.text?.replace(/\n/g, "<br/>") || ""}`,
      replyTo: "",
    });
    setShowCompose(true);
  };

  const handleForward = () => {
    if (!selectedEmail) return;
    setComposeMode("forward");
    setComposeData({
      to: "",
      cc: "",
      subject: selectedEmail.subject.startsWith("Fwd:")
        ? selectedEmail.subject
        : `Fwd: ${selectedEmail.subject}`,
      body: `<br/><br/>------- Forwarded Message -------<br/><strong>From:</strong> ${selectedEmail.from}<br/><strong>Date:</strong> ${formatDate(selectedEmail.date)}<br/><strong>Subject:</strong> ${selectedEmail.subject}<br/><br/>${selectedEmail.html || selectedEmail.text?.replace(/\n/g, "<br/>") || ""}`,
      replyTo: "",
    });
    setShowCompose(true);
  };

  const handleSend = async () => {
    if (!composeData.to || !composeData.subject) return;
    setComposeSending(true);

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: composeData.to,
          cc: composeData.cc || undefined,
          subject: composeData.subject,
          body: composeData.body,
          replyTo: composeData.replyTo || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCompose(false);
        setComposeData({ to: "", cc: "", subject: "", body: "", replyTo: "" });
      } else {
        setError(data.error || "Failed to send email");
      }
    } catch {
      setError("Failed to send email");
    } finally {
      setComposeSending(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    reset();
    router.push("/login");
  };

  const filteredEmails = emails.filter(
    (e) =>
      !search ||
      e.subject.toLowerCase().includes(search.toLowerCase()) ||
      e.from.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = emails.filter((e) => !e.read).length;

  const accentColor = currentAccount
    ? COLOR_MAP[currentAccount.colorTag] || "bg-gray-500"
    : "bg-gray-500";

  // Build folder list with icons
  const folderList = folders.length > 0 ? folders : [
    { name: "INBOX", path: "INBOX", specialUse: "\\Inbox" },
    { name: "Sent", path: "Sent", specialUse: "\\Sent" },
    { name: "Drafts", path: "Drafts", specialUse: "\\Drafts" },
    { name: "Trash", path: "Trash", specialUse: "\\Trash" },
    { name: "Junk", path: "Junk", specialUse: "\\Junk" },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* ── TOP TOOLBAR ── */}
      <header className="h-12 bg-[#1a2e3b] text-white flex items-center px-3 gap-3 shrink-0 z-20">
        {/* Mobile sidebar toggle */}
        <button
          className="md:hidden p-1 rounded hover:bg-white/10"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-5 h-5">
              <rect x="4" y="8" width="32" height="24" rx="3" fill="#006B3C" />
              <path d="M4 12 L20 24 L36 12" stroke="#FFB612" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-bold text-sm hidden sm:block">Mzansi BizMail</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search emails..."
              className="w-full bg-white/10 text-white placeholder-white/40 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:bg-white/20 border border-white/10 focus:border-white/30"
            />
          </div>
        </div>

        {/* Account avatar */}
        {currentAccount && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-white/60 text-sm hidden sm:block truncate max-w-[140px]">
              {currentAccount.email}
            </span>
            <div
              className={`w-8 h-8 rounded-full ${accentColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}
            >
              {currentAccount.email[0].toUpperCase()}
            </div>
          </div>
        )}
      </header>

      {/* ── BODY: sidebar + email list + preview ── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ── SIDEBAR ── */}
        <aside
          className={`
            ${showSidebar ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0
            absolute md:relative z-30 md:z-0
            w-56 h-full flex flex-col bg-[#1a2e3b] text-white shrink-0
            transition-transform duration-200
          `}
        >
          {/* Compose button */}
          <div className="p-3">
            <button
              onClick={() => {
                setComposeMode("new");
                setComposeData({ to: "", cc: "", subject: "", body: "", replyTo: "" });
                setShowCompose(true);
                setShowSidebar(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#006B3C] hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Compose
            </button>
          </div>

          {/* Folder list */}
          <nav className="flex-1 overflow-y-auto px-2 pb-2">
            <p className="text-white/40 text-xs uppercase tracking-wider px-2 py-2 mt-2">Folders</p>
            {folderList.map((folder) => {
              const icon = FOLDER_ICONS[folder.name] || "📁";
              const isActive = currentFolder === folder.path;
              return (
                <button
                  key={folder.path}
                  onClick={() => {
                    setCurrentFolder(folder.path);
                    setShowSidebar(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                    isActive
                      ? "bg-white/15 text-white font-medium"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  <span className="flex-1 text-left truncate">{folder.name}</span>
                  {folder.name === "INBOX" && unreadCount > 0 && (
                    <span className="bg-[#006B3C] text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Account + logout */}
          <div className="p-3 border-t border-white/10">
            {currentAccount && (
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-8 h-8 rounded-full ${accentColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}
                >
                  {currentAccount.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{currentAccount.name}</p>
                  <p className="text-white/50 text-xs truncate">{currentAccount.email}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-white/60 hover:text-white text-sm py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {showSidebar && (
          <div
            className="md:hidden absolute inset-0 bg-black/50 z-20"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* ── EMAIL LIST ── */}
        <div
          className={`
            w-full md:w-72 lg:w-80 xl:w-96 shrink-0
            flex flex-col bg-white border-r border-gray-200
            ${selectedEmail ? "hidden md:flex" : "flex"}
          `}
        >
          {/* List header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">{currentFolder}</h2>
              <p className="text-xs text-gray-400">
                {totalEmails > 0 ? `${totalEmails} messages` : "Empty"}
                {unreadCount > 0 && ` · ${unreadCount} unread`}
              </p>
            </div>
            <button
              onClick={() => loadEmails(currentFolder, 1)}
              disabled={isSyncing}
              title="Refresh"
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              <svg
                className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Email items */}
          <div className="flex-1 overflow-y-auto">
            {isSyncing && emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <svg className="w-8 h-8 text-[#006B3C] animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-gray-400 text-sm">Loading emails...</p>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-gray-500 text-sm">
                  {search ? "No emails match your search" : "No emails in this folder"}
                </p>
              </div>
            ) : (
              filteredEmails.map((email) => (
                <button
                  key={email.uid}
                  onClick={() => openEmail(email)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedEmail?.uid === email.uid ? "bg-blue-50 border-l-2 border-l-[#006B3C]" : ""
                  } ${!email.read ? "bg-green-50/40" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {/* Unread dot */}
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!email.read ? "bg-[#006B3C]" : "bg-transparent"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-1">
                        <span className={`text-sm truncate ${!email.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                          {email.from.split("<")[0].trim() || email.fromAddress}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">{formatDate(email.date)}</span>
                      </div>
                      <p className={`text-sm truncate mt-0.5 ${!email.read ? "font-medium text-gray-800" : "text-gray-600"}`}>
                        {email.subject}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {email.hasAttachments && (
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        )}
                        {email.flagged && (
                          <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 3v18l9-4.5L21 21V3H3z" />
                          </svg>
                        )}
                        {email.size ? (
                          <span className="text-xs text-gray-300">{formatSize(email.size)}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-200 flex items-center justify-between">
              <p className="text-red-600 text-xs">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* ── EMAIL PREVIEW PANE ── */}
        <div
          className={`
            flex-1 flex flex-col bg-white overflow-hidden
            ${selectedEmail || isLoadingEmail ? "flex" : "hidden md:flex"}
          `}
        >
          {isLoadingEmail ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-10 h-10 text-[#006B3C] animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-gray-400 text-sm">Loading email...</p>
              </div>
            </div>
          ) : selectedEmail ? (
            <>
              {/* Email toolbar */}
              <div className="px-4 py-2.5 border-b border-gray-200 flex items-center gap-2 bg-gray-50 shrink-0">
                {/* Back button (mobile) */}
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="md:hidden p-1.5 rounded hover:bg-gray-200 text-gray-600 mr-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={handleReply}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006B3C] text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Reply
                </button>

                <button
                  onClick={handleForward}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" />
                  </svg>
                  Forward
                </button>

                <div className="flex-1" />

                <button
                  onClick={() => handleAction("mark-unread", selectedEmail.uid)}
                  title="Mark as unread"
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>

                <button
                  onClick={() => handleAction("flag", selectedEmail.uid)}
                  title="Flag"
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-yellow-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18l9-4.5L21 21V3H3z" />
                  </svg>
                </button>

                <button
                  onClick={() => handleAction("delete", selectedEmail.uid)}
                  title="Delete"
                  className="p-1.5 rounded-lg hover:bg-red-100 text-gray-500 hover:text-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Email header */}
              <div className="px-6 py-4 border-b border-gray-100 shrink-0">
                <h1 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                  {selectedEmail.subject}
                </h1>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
                    {(selectedEmail.fromAddress || selectedEmail.from)[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm truncate">{selectedEmail.from}</p>
                      <time className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                        {new Date(selectedEmail.date).toLocaleString("en-ZA", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="text-gray-400">To:</span> {selectedEmail.to}
                    </p>
                    {selectedEmail.cc && (
                      <p className="text-xs text-gray-500">
                        <span className="text-gray-400">Cc:</span> {selectedEmail.cc}
                      </p>
                    )}
                  </div>
                </div>

                {/* Attachments */}
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedEmail.attachments.map((att, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-700"
                      >
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span>{att.filename || "attachment"}</span>
                        <span className="text-gray-400">{formatSize(att.size)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Email body */}
              <div className="flex-1 overflow-auto">
                {selectedEmail.html ? (
                  <iframe
                    ref={iframeRef}
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta charset="utf-8"/>
                          <meta name="viewport" content="width=device-width, initial-scale=1"/>
                          <base target="_blank"/>
                          <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #333; padding: 24px; margin: 0; }
                            img { max-width: 100%; height: auto; }
                            a { color: #006B3C; }
                            table { border-collapse: collapse; max-width: 100%; }
                            * { box-sizing: border-box; }
                          </style>
                        </head>
                        <body>${selectedEmail.html}</body>
                      </html>
                    `}
                    className="w-full h-full border-0"
                    sandbox="allow-popups allow-same-origin"
                    title="Email content"
                  />
                ) : (
                  <div className="px-6 py-4">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                      {selectedEmail.text || "(No content)"}
                    </pre>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Empty state
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-400 font-medium">Select an email to read</p>
              <p className="text-gray-300 text-sm mt-1">Choose from your {currentFolder} on the left</p>
            </div>
          )}
        </div>
      </div>

      {/* ── COMPOSE MODAL ── */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
            {/* Compose header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-gray-900">
                {composeMode === "reply" ? "Reply" : composeMode === "forward" ? "Forward" : "New Message"}
              </h3>
              <button
                onClick={() => setShowCompose(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Compose fields */}
            <div className="flex-1 overflow-y-auto">
              <div className="border-b px-5 py-2.5 flex items-center gap-3">
                <span className="text-sm text-gray-500 w-12 shrink-0">To</span>
                <input
                  type="email"
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                  placeholder="recipient@example.co.za"
                  className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400"
                  autoFocus={composeMode === "new" || composeMode === "forward"}
                />
              </div>

              <div className="border-b px-5 py-2.5 flex items-center gap-3">
                <span className="text-sm text-gray-500 w-12 shrink-0">Cc</span>
                <input
                  type="text"
                  value={composeData.cc}
                  onChange={(e) => setComposeData({ ...composeData, cc: e.target.value })}
                  placeholder="Optional"
                  className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400"
                />
              </div>

              <div className="border-b px-5 py-2.5 flex items-center gap-3">
                <span className="text-sm text-gray-500 w-12 shrink-0">Subject</span>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  placeholder="Subject"
                  className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400 font-medium"
                  autoFocus={composeMode === "reply"}
                />
              </div>

              <textarea
                value={composeData.body.replace(/<[^>]*>/g, "")}
                onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                placeholder="Write your message..."
                className="w-full px-5 py-4 text-sm text-gray-900 placeholder-gray-400 outline-none resize-none min-h-[200px] leading-relaxed"
              />
            </div>

            {/* Compose footer */}
            <div className="px-5 py-3 border-t flex items-center justify-between gap-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowCompose(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Discard
              </button>
              <button
                onClick={handleSend}
                disabled={composeSending || !composeData.to || !composeData.subject}
                className="flex items-center gap-2 px-5 py-2 bg-[#006B3C] text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {composeSending ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
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
      )}
    </div>
  );
}
