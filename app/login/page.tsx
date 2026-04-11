"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccountStore } from "@/store/accountStore";

const COLOR_MAP: Record<string, string> = {
  green: "bg-green-600",
  yellow: "bg-yellow-500",
  blue: "bg-blue-600",
  red: "bg-red-600",
  purple: "bg-purple-600",
  orange: "bg-orange-500",
};

export default function LoginPage() {
  const router = useRouter();
  const { savedAccounts } = useAccountStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showManual, setShowManual] = useState(false);

  const selectedAccount = savedAccounts.find((a) => a.id === selected);

  useEffect(() => {
    if (savedAccounts.length === 1) {
      setSelected(savedAccounts[0].id);
    }
  }, [savedAccounts]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !password) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedAccount.email,
          password,
          imapHost: selectedAccount.imapHost,
          imapPort: selectedAccount.imapPort,
          smtpHost: selectedAccount.smtpHost,
          smtpPort: selectedAccount.smtpPort,
          accountId: selectedAccount.id,
          colorTag: selectedAccount.colorTag,
          name: selectedAccount.name,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/mailbox");
      } else {
        setError(data.error || "Login failed. Check your password.");
      }
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#006B3C] via-[#008C4A] to-[#00A85C] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 40 40" className="w-10 h-10">
                <rect x="4" y="8" width="32" height="24" rx="3" fill="#006B3C" />
                <path
                  d="M4 12 L20 24 L36 12"
                  stroke="#FFB612"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">Mzansi BizMail</span>
          </div>
          <p className="text-white/70 text-sm">Business email for South Africa</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {savedAccounts.length === 0 ? (
            // No saved accounts
            <div className="text-center">
              <div className="text-5xl mb-4">📬</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome</h2>
              <p className="text-gray-500 mb-6">
                Set up your email account to get started.
              </p>
              <Link
                href="/setup"
                className="block w-full py-3 bg-[#006B3C] text-white font-bold rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                Set Up Email Account
              </Link>
            </div>
          ) : !selected ? (
            // Account selection
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign In</h2>
              <p className="text-gray-500 mb-6 text-sm">Choose your account</p>

              <div className="space-y-3 mb-6">
                {savedAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => setSelected(account.id)}
                    className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#006B3C] hover:bg-green-50 transition-all group"
                  >
                    <div
                      className={`w-12 h-12 rounded-full ${COLOR_MAP[account.colorTag] || "bg-gray-400"} flex items-center justify-center text-white font-bold text-lg shrink-0`}
                    >
                      {account.email[0].toUpperCase()}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{account.name}</p>
                      <p className="text-sm text-gray-500 truncate">{account.email}</p>
                      <p className="text-xs text-gray-400">{account.imapHost}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-[#006B3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>

              <div className="border-t pt-4">
                <Link
                  href="/setup"
                  className="flex items-center justify-center gap-2 text-[#006B3C] font-medium hover:underline"
                >
                  <span>+</span> Add another account
                </Link>
              </div>
            </div>
          ) : (
            // Password entry
            <form onSubmit={handleLogin}>
              <button
                type="button"
                onClick={() => { setSelected(null); setPassword(""); setError(""); }}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`w-14 h-14 rounded-full ${COLOR_MAP[selectedAccount?.colorTag || ""] || "bg-gray-400"} flex items-center justify-center text-white font-bold text-xl shrink-0`}
                >
                  {selectedAccount?.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{selectedAccount?.name}</p>
                  <p className="text-sm text-gray-500">{selectedAccount?.email}</p>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your email password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006B3C] focus:border-transparent text-base"
                  autoFocus
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-3 bg-[#006B3C] text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>

              <div className="mt-4 text-center">
                <Link href="/setup" className="text-sm text-[#006B3C] hover:underline">
                  Add a different account
                </Link>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          Mzansi BizMail &mdash; Secure Business Email
        </p>
      </div>
    </div>
  );
}
