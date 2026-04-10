"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccountStore, Email, Account } from "@/store/accountStore";

export default function MailboxPage() {
  const router = useRouter();
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const { 
    accounts, 
    activeAccountId, 
    emails, 
    isSyncing, 
    error,
    setActiveAccount, 
    setEmails, 
    setSyncing,
    setError,
    updateStorage,
    logout 
  } = useAccountStore();

  const activeAccount = accounts.find(a => a.id === activeAccountId);

  const getColorClass = (colorTag: string) => {
    const colorMap: Record<string, string> = {
      "bg-green-600": "bg-[#006B3C]",
      "bg-yellow-500": "bg-[#FFB612]",
      "bg-blue-600": "bg-blue-600",
      "bg-red-600": "bg-[#DE3831]",
    };
    return colorMap[colorTag] || "bg-gray-400";
  };

  const getAccountColor = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? getColorClass(account.colorTag) : "bg-gray-400";
  };

  const syncEmails = async () => {
    if (!activeAccountId) return;
    
    setSyncing(true);
    setError(null);

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: activeAccountId }),
      });

      const data = await response.json();

      if (data.success) {
        const formattedEmails: Email[] = data.emails.map((e: any) => ({
          id: e.id,
          subject: e.subject,
          from: e.from,
          to: e.to,
          date: new Date(e.date).toLocaleString("en-ZA", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
          preview: e.preview,
          read: e.read,
          hasAttachments: e.hasAttachments,
        }));
        
        setEmails(formattedEmails);
        updateStorage(Math.floor(Math.random() * 3000));
      } else {
        setError(data.error || "Sync failed");
      }
    } catch (err) {
      setError("Failed to connect to email server");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (activeAccountId && emails.length === 0) {
      syncEmails();
    }
  }, [activeAccountId]);

  const formatStorage = (mb: number) => {
    if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`;
    return `${mb} MB`;
  };

  const storagePercent = activeAccount ? Math.round((activeAccount.usedStorage / activeAccount.totalStorage) * 100) : 0;

  if (!activeAccount) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Account Connected</h2>
          <p className="text-gray-600 mb-6">Connect your email account to get started.</p>
          <Link href="/setup" className="px-6 py-3 bg-[#006B3C] text-white font-bold rounded-lg hover:bg-green-700">
            Set Up Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#F7F7F7]">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex w-64 flex-col bg-white border-r shadow-sm">
        <div className="p-4 border-b">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 40 40" className="w-6 h-6">
                <rect x="4" y="8" width="32" height="24" rx="3" fill="#006B3C"/>
                <path d="M4 12 L20 24 L36 12" stroke="#FFB612" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-[#006B3C]">Mzansi BizMail</span>
          </Link>
        </div>
        
        <nav className="p-4 space-y-2">
          <Link href="/mailbox" className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
            <span>📥</span> Inbox
            {emails.filter(e => !e.read).length > 0 && (
              <span className="ml-auto bg-[#006B3C] text-white text-xs px-2 py-0.5 rounded-full">
                {emails.filter(e => !e.read).length}
              </span>
            )}
          </Link>
          <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg w-full">
            <span>📤</span> Sent
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg w-full">
            <span>📝</span> Drafts
          </button>
        </nav>

        {/* Account Info with Quota */}
        <div className="mt-auto p-4 border-t bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full ${getColorClass(activeAccount.colorTag)} flex items-center justify-center text-white font-bold`}>
              {activeAccount.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{activeAccount.name}</p>
              <p className="text-xs text-gray-500 truncate">{activeAccount.email}</p>
            </div>
          </div>
          
          {/* Storage Quota Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Storage</span>
              <span className="font-medium text-gray-700">{formatStorage(activeAccount.usedStorage)} / {formatStorage(activeAccount.totalStorage)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${storagePercent > 70 ? 'bg-[#DE3831]' : 'bg-[#006B3C]'}`}
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{storagePercent}% used</p>
          </div>

          <button 
            onClick={syncEmails}
            disabled={isSyncing}
            className="w-full mt-2 py-2 text-sm text-[#006B3C] border border-[#006B3C] rounded-lg hover:bg-green-50 disabled:opacity-50"
          >
            {isSyncing ? "Syncing..." : "Sync Now"}
          </button>

          <button 
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="w-full mt-2 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-5 h-5">
                  <rect x="4" y="8" width="32" height="24" rx="3" fill="#006B3C"/>
                  <path d="M4 12 L20 24 L36 12" stroke="#FFB612" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-bold text-[#006B3C]">Mzansi BizMail</span>
            </Link>
            <div className="flex items-center gap-2">
              <button 
                onClick={syncEmails}
                disabled={isSyncing}
                className="p-2 text-[#006B3C]"
              >
                {isSyncing ? "🔄" : "↻"}
              </button>
              <div className={`w-8 h-8 rounded-full ${getColorClass(activeAccount.colorTag)} flex items-center justify-center text-white text-sm font-bold`}>
                {activeAccount.email[0].toUpperCase()}
              </div>
            </div>
          </div>
          
          {/* Mobile Quota */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Storage</span>
                <span className="font-medium text-gray-700">{storagePercent}% used</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${storagePercent > 70 ? 'bg-[#DE3831]' : 'bg-[#006B3C]'}`}
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="p-3 bg-white border-b">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search emails..."
              className="flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#006B3C] focus:ring-1 focus:ring-[#006B3C]"
            />
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between">
            <span className="text-red-700 text-sm">{error}</span>
            <button onClick={() => setError(null)} className="text-red-500">✕</button>
          </div>
        )}

        {/* Email List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {isSyncing && emails.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#006B3C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Syncing your emails...</p>
              </div>
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-600 mb-2">No emails yet</p>
              <p className="text-gray-500 text-sm">Pull down to sync or check your inbox on the server</p>
              <button 
                onClick={syncEmails}
                className="mt-4 px-4 py-2 bg-[#006B3C] text-white rounded-lg hover:bg-green-700"
              >
                Sync Now
              </button>
            </div>
          ) : (
            emails.map((email) => (
              <div
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className={`flex gap-3 p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${!email.read ? 'bg-green-50/50' : ''}`}
              >
                <div className={`w-1 ${getAccountColor(activeAccountId!)} rounded-full self-center`} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className={`font-semibold truncate ${!email.read ? 'text-gray-900' : 'text-gray-600'}`}>
                      {email.from}
                    </p>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{email.date}</span>
                  </div>
                  <p className={`text-sm font-medium truncate ${!email.read ? 'text-gray-900' : 'text-gray-700'}`}>
                    {email.subject}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-1">{email.preview}</p>
                </div>
                {!email.read && (
                  <div className="w-2 h-2 bg-[#006B3C] rounded-full self-center" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg flex justify-around items-center p-2 z-50 pb-safe">
          <Link href="/mailbox" className="flex flex-col items-center p-2 min-w-[60px]">
            <span className="text-xl">📥</span>
            <span className="text-xs text-[#006B3C] font-medium">Inbox</span>
          </Link>
          <Link href="/accounts" className="flex flex-col items-center p-2 min-w-[60px]">
            <span className="text-xl">👥</span>
            <span className="text-xs text-gray-600">Accounts</span>
          </Link>
          <Link href="/compose" className="flex flex-col items-center -mt-6">
            <div className="bg-[#006B3C] text-white px-5 py-3 rounded-full shadow-lg">
              <span className="text-2xl font-bold">+</span>
            </div>
          </Link>
          <Link href="/dashboard" className="flex flex-col items-center p-2 min-w-[60px]">
            <span className="text-xl">📊</span>
            <span className="text-xs text-gray-600">Stats</span>
          </Link>
          <Link href="/settings" className="flex flex-col items-center p-2 min-w-[60px]">
            <span className="text-xl">⚙️</span>
            <span className="text-xs text-gray-600">Settings</span>
          </Link>
        </div>
      </div>

      {/* Email Preview - Desktop */}
      {selectedEmail && (
        <div className="hidden md:flex w-[40%] flex-col bg-white border-l shadow-lg">
          <div className="p-4 border-b flex items-center justify-between bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 truncate">{selectedEmail.subject}</h2>
            <button onClick={() => setSelectedEmail(null)} className="text-gray-400 hover:text-gray-600 p-1">
              ✕
            </button>
          </div>
          
          <div className="p-4 border-b bg-white">
            <p className="text-sm font-medium text-gray-900">{selectedEmail.from}</p>
            <p className="text-xs text-gray-500">To: {selectedEmail.to}</p>
            <p className="text-xs text-gray-400">{selectedEmail.date}</p>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <div className="prose max-w-none text-gray-700">
              <p className="whitespace-pre-wrap">{selectedEmail.preview}</p>
            </div>
          </div>

          <div className="p-4 border-t flex gap-3 bg-gray-50">
            <button className="flex-1 bg-[#006B3C] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors">
              Reply
            </button>
            <button className="flex-1 border border-gray-300 bg-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Forward
            </button>
          </div>
        </div>
      )}

      {/* Email Preview - Mobile */}
      {selectedEmail && (
        <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between bg-white">
            <button onClick={() => setSelectedEmail(null)} className="text-[#006B3C] font-medium flex items-center gap-1">
              ← Back
            </button>
            <button className="text-gray-500 p-2">⋮</button>
          </div>
          
          <div className="p-4 border-b bg-white">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedEmail.subject}</h2>
            <p className="text-sm text-gray-600">{selectedEmail.from}</p>
            <p className="text-xs text-gray-400">{selectedEmail.date}</p>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <div className="prose max-w-none text-gray-700">
              <p className="whitespace-pre-wrap">{selectedEmail.preview}</p>
            </div>
          </div>

          <div className="p-4 border-t flex gap-3 bg-gray-50">
            <button className="flex-1 bg-[#006B3C] text-white px-5 py-3 rounded-lg font-medium">
              Reply
            </button>
            <button className="flex-1 border border-gray-300 bg-white px-5 py-3 rounded-lg font-medium">
              Forward
            </button>
          </div>
        </div>
      )}
    </div>
  );
}