"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccountStore } from "@/store/accountStore";

const COLOR_MAP: Record<string, string> = {
  green: "bg-green-600",
  yellow: "bg-amber-500",
  blue: "bg-blue-600",
  red: "bg-red-600",
  purple: "bg-purple-600",
  orange: "bg-orange-500",
};

// ─── error definitions ────────────────────────────────────────────────────────

type ErrorCode = "wrong_password" | "server_unreachable" | "timeout" | "ssl_error" | "unknown";

interface ErrorDef {
  icon: string;
  title: string;
  body: (attempts: number, email: string) => string;
  hint?: string;
}

const ERROR_DEFS: Record<ErrorCode, ErrorDef> = {
  wrong_password: {
    icon: "🔑",
    title: "Password not recognised",
    body: (attempts, email) => {
      if (attempts === 1) return "That doesn't match what your mail server has on file. Check for a typo or try copy-pasting from your password manager.";
      if (attempts === 2) return "Still no luck. Make sure you're using your email account password — not a phone PIN or a master password.";
      return `${attempts} attempts and counting. Is Caps Lock on? Also worth checking: some hosts use an app-specific password rather than your main one.`;
    },
    hint: "Tip: this is the same password you use in Outlook or Thunderbird for this account.",
  },
  server_unreachable: {
    icon: "📡",
    title: "Can't reach your mail server",
    body: () => `The server at that address isn't responding — it may be offline, or the hostname might be wrong.`,
    hint: "Check your internet connection, then verify the IMAP hostname in your account settings.",
  },
  timeout: {
    icon: "⏱️",
    title: "Connection timed out",
    body: () => "Your mail server took too long to respond. It might be under load or briefly unavailable.",
    hint: "Wait a moment and try again. If this keeps happening, check whether your server requires a VPN.",
  },
  ssl_error: {
    icon: "🔒",
    title: "Security certificate issue",
    body: () => "There's a problem with the SSL/TLS certificate on your mail server — it may be self-signed or expired.",
    hint: "Contact your hosting provider or IT team. This is a server-side configuration issue.",
  },
  unknown: {
    icon: "⚡",
    title: "Something went wrong",
    body: () => "We couldn't sign you in — an unexpected error occurred when connecting to your mail server.",
    hint: "Try again. If the problem continues, double-check your server settings.",
  },
};

// ─── error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({
  code,
  attempts,
  email,
  onDismiss,
}: {
  code: ErrorCode;
  attempts: number;
  email: string;
  onDismiss: () => void;
}) {
  const def = ERROR_DEFS[code];
  const isWrongPassword = code === "wrong_password";

  return (
    <div className={`rounded-xl border p-4 mb-5 ${
      isWrongPassword
        ? "bg-red-50 border-red-200"
        : "bg-amber-50 border-amber-200"
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none mt-0.5">{def.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${isWrongPassword ? "text-red-800" : "text-amber-800"}`}>
            {def.title}
          </p>
          <p className={`text-sm mt-1 ${isWrongPassword ? "text-red-700" : "text-amber-700"}`}>
            {def.body(attempts, email)}
          </p>
          {def.hint && (
            <p className={`text-xs mt-2 ${isWrongPassword ? "text-red-500" : "text-amber-600"}`}>
              {def.hint}
            </p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className={`p-0.5 rounded shrink-0 ${isWrongPassword ? "text-red-400 hover:text-red-600" : "text-amber-400 hover:text-amber-600"}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { savedAccounts } = useAccountStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);
  const selectedAccount = savedAccounts.find((a) => a.id === selected);

  useEffect(() => {
    if (savedAccounts.length === 1) setSelected(savedAccounts[0].id);
  }, [savedAccounts]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !password) return;

    setLoading(true);
    setErrorCode(null);

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
          name: selectedAccount.displayName || selectedAccount.name,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/mailbox");
      } else {
        const code: ErrorCode = data.errorCode || "unknown";
        setErrorCode(code);
        setAttempts((n) => n + 1);
        triggerShake();
        // Clear password only on wrong password so other errors keep context
        if (code === "wrong_password") {
          setPassword("");
          setTimeout(() => passwordRef.current?.focus(), 50);
        }
      }
    } catch {
      setErrorCode("unknown");
      setAttempts((n) => n + 1);
      triggerShake();
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
                <path d="M4 12 L20 24 L36 12" stroke="#FFB612" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">Mzansi BizMail</span>
          </div>
          <p className="text-white/70 text-sm">Business email for South Africa</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* ── No saved accounts ── */}
          {savedAccounts.length === 0 ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📬</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome</h2>
              <p className="text-gray-500 mb-6">Set up your email account to get started.</p>
              <Link
                href="/setup"
                className="block w-full py-3 bg-[#006B3C] text-white font-bold rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                Set Up Email Account
              </Link>
            </div>

          /* ── Account selection ── */
          ) : !selected ? (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign In</h2>
              <p className="text-gray-500 mb-6 text-sm">Choose your account</p>

              <div className="space-y-3 mb-6">
                {savedAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => { setSelected(account.id); setErrorCode(null); setAttempts(0); }}
                    className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#006B3C] hover:bg-green-50 transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-full ${COLOR_MAP[account.colorTag] || "bg-gray-400"} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                      {(account.displayName || account.email)[0].toUpperCase()}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{account.displayName || account.name}</p>
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
                <Link href="/setup" className="flex items-center justify-center gap-2 text-[#006B3C] font-medium hover:underline text-sm">
                  <span>+</span> Add another account
                </Link>
              </div>
            </div>

          /* ── Password entry ── */
          ) : (
            <form onSubmit={handleLogin}>
              {/* Back */}
              <button
                type="button"
                onClick={() => { setSelected(null); setPassword(""); setErrorCode(null); setAttempts(0); }}
                className="flex items-center gap-1 text-gray-400 hover:text-gray-600 mb-6 text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                All accounts
              </button>

              {/* Account chip */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className={`w-14 h-14 rounded-full ${COLOR_MAP[selectedAccount?.colorTag || ""] || "bg-gray-400"} flex items-center justify-center text-white font-bold text-xl shrink-0`}>
                  {(selectedAccount?.displayName || selectedAccount?.email || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{selectedAccount?.displayName || selectedAccount?.name}</p>
                  <p className="text-sm text-gray-500">{selectedAccount?.email}</p>
                </div>
              </div>

              {/* Error banner */}
              {errorCode && (
                <ErrorBanner
                  code={errorCode}
                  attempts={attempts}
                  email={selectedAccount?.email || ""}
                  onDismiss={() => setErrorCode(null)}
                />
              )}

              {/* Password field with shake animation */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div
                  className={shake ? "animate-[shake_0.5s_ease-in-out]" : ""}
                  style={shake ? { animation: "shake 0.5s ease-in-out" } : {}}
                >
                  <input
                    ref={passwordRef}
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorCode(null); }}
                    placeholder="Enter your email password"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-base transition-colors ${
                      errorCode === "wrong_password"
                        ? "border-red-300 bg-red-50 focus:ring-red-400"
                        : "border-gray-300 focus:ring-[#006B3C]"
                    }`}
                    autoFocus
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !password}
                className={`w-full py-3 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  errorCode === "wrong_password"
                    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    : "bg-[#006B3C] hover:bg-green-700"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : errorCode === "wrong_password" ? (
                  "Try Again"
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

      {/* Shake keyframe */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-6px); }
          30%       { transform: translateX(6px); }
          45%       { transform: translateX(-4px); }
          60%       { transform: translateX(4px); }
          75%       { transform: translateX(-2px); }
          90%       { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
}
