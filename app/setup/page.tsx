"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccountStore } from "@/store/accountStore";

type Step = 1 | 2 | 3;

interface FormData {
  email: string;
  password: string;
  imapHost: string;
  imapPort: string;
  smtpHost: string;
  smtpPort: string;
}

export default function SetupPage() {
  const router = useRouter();
  const saveAccount = useAccountStore((s) => s.saveAccount);

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    imapHost: "",
    imapPort: "993",
    smtpHost: "",
    smtpPort: "587",
  });

  const detectServers = (email: string) => {
    const domain = email.split("@")[1] || "";
    return {
      imapHost: `mail.${domain}`,
      smtpHost: `mail.${domain}`,
    };
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    const servers = detectServers(formData.email);
    setFormData((prev) => ({
      ...prev,
      imapHost: servers.imapHost,
      smtpHost: servers.smtpHost,
    }));
    setStep(2);
    setError("");
  };

  const handleServerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imapHost || !formData.smtpHost) {
      setError("Please configure IMAP and SMTP servers");
      return;
    }
    setStep(3);
    setError("");
  };

  const handleConnect = async () => {
    if (!formData.password) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/accounts/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        // Save account config to localStorage (no password stored)
        saveAccount({
          id: data.account.id,
          email: data.account.email,
          name: data.account.name,
          colorTag: data.account.colorTag,
          imapHost: data.account.imapHost,
          imapPort: data.account.imapPort,
          smtpHost: data.account.smtpHost,
          smtpPort: data.account.smtpPort,
          addedAt: new Date().toISOString(),
        });

        router.push("/mailbox");
      } else {
        setError(data.error || "Failed to connect. Check your server settings and credentials.");
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
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  s === step
                    ? "bg-[#FFB612] text-[#1A1A1A]"
                    : s < step
                    ? "bg-white text-[#006B3C]"
                    : "bg-white/30 text-white"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
              {s < 3 && <div className={`w-12 h-1 ${s < step ? "bg-white" : "bg-white/30"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleEmailSubmit}>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Connect Your Email</h2>
              <p className="text-gray-500 mb-6 text-sm">
                Enter your business email address to get started.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@yourbusiness.co.za"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006B3C] focus:border-transparent text-base"
                  autoFocus
                />
              </div>

              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

              <button
                type="submit"
                className="w-full py-3 bg-[#006B3C] text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
              >
                Continue
              </button>
            </form>
          )}

          {/* Step 2: Server Config */}
          {step === 2 && (
            <form onSubmit={handleServerSubmit}>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Server Settings</h2>
              <p className="text-gray-500 mb-6 text-sm">
                We've auto-detected your server settings. Adjust if needed.
              </p>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">IMAP Server</label>
                    <input
                      type="text"
                      value={formData.imapHost}
                      onChange={(e) => setFormData({ ...formData, imapHost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006B3C] text-sm"
                      placeholder="mail.example.co.za"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                    <input
                      type="text"
                      value={formData.imapPort}
                      onChange={(e) => setFormData({ ...formData, imapPort: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006B3C] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Server</label>
                    <input
                      type="text"
                      value={formData.smtpHost}
                      onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006B3C] text-sm"
                      placeholder="mail.example.co.za"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                    <input
                      type="text"
                      value={formData.smtpPort}
                      onChange={(e) => setFormData({ ...formData, smtpPort: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006B3C] text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-blue-700 text-xs">
                  <strong>IMAP port 993</strong> uses SSL/TLS. <strong>SMTP port 587</strong> uses STARTTLS.
                  Port 465 uses SMTP over SSL.
                </p>
              </div>

              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#006B3C] text-white font-bold rounded-lg hover:bg-green-700"
                >
                  Continue
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Password */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Enter Password</h2>
              <p className="text-gray-500 mb-6 text-sm">
                Your credentials are encrypted with AES-256 before storage.
              </p>

              <div className="bg-gray-50 rounded-lg p-3 mb-5 text-sm">
                <p className="text-gray-600">
                  <span className="font-medium">Account:</span> {formData.email}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">IMAP:</span> {formData.imapHost}:{formData.imapPort}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">SMTP:</span> {formData.smtpHost}:{formData.smtpPort}
                </p>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                  placeholder="Enter your email password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006B3C] focus:border-transparent text-base"
                  autoFocus
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-5">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-sm text-green-700">
                    Your password will be verified against your IMAP server and never stored in plain text.
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={loading || !formData.password}
                  className="flex-1 py-3 bg-[#006B3C] text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Connecting...
                    </span>
                  ) : (
                    "Connect Account"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          Mzansi BizMail &mdash; Secure Business Email
        </p>
      </div>
    </div>
  );
}
