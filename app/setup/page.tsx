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

export default function SetupWizard() {
  const router = useRouter();
  const storeSetAccount = useAccountStore((s) => s.setAccount);
  const setActiveAccount = useAccountStore((s) => s.setActiveAccount);
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

  const getDomain = (email: string) => {
    const parts = email.split("@");
    return parts.length === 2 ? parts[1] : "";
  };

  const detectServers = (email: string) => {
    const domain = getDomain(email);
    return [
      { imap: "mail.domain.co.za", smtp: "mail.domain.co.za" },
      { imap: `mail.${domain}`, smtp: `mail.${domain}` },
      { imap: `imap.${domain}`, smtp: `smtp.${domain}` },
      { imap: `${domain.split(".")[0]}.webmail.co.za`, smtp: `${domain.split(".")[0]}.webmail.co.za` },
    ];
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
      imapHost: servers[1].imap.replace("domain.co.za", getDomain(prev.email)),
      smtpHost: servers[1].smtp.replace("domain.co.za", getDomain(prev.email)),
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
      const response = await fetch("/api/accounts/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        storeSetAccount(data.account);
        setActiveAccount(data.account.id);
        
        try {
          await fetch("/api/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accountId: data.account.id }),
          });
        } catch (syncErr) {
          console.log("Initial sync skipped:", syncErr);
        }

        router.push("/mailbox");
      } else {
        setError(data.error || "Failed to connect. Please check your credentials.");
      }
    } catch (err) {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#006B3C] via-[#008C4A] to-[#00A85C] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 40 40" className="w-10 h-10">
                <rect x="4" y="8" width="32" height="24" rx="3" fill="#006B3C"/>
                <path d="M4 12 L20 24 L36 12" stroke="#FFB612" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">Mzansi BizMail</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                s === step 
                  ? "bg-[#FFB612] text-[#1A1A1A]" 
                  : s < step 
                    ? "bg-white text-[#006B3C]" 
                    : "bg-white/30 text-white"
              }`}>
                {s < step ? "✓" : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-1 ${s < step ? "bg-white" : "bg-white/30"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {step === 1 && (
            <form onSubmit={handleEmailSubmit}>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Email</h2>
              <p className="text-gray-600 mb-6">Enter your business email address to get started.</p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@yourbusiness.co.za"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006B3C] focus:border-transparent text-lg"
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

          {step === 2 && (
            <form onSubmit={handleServerSubmit}>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Server Settings</h2>
              <p className="text-gray-600 mb-6">We've auto-detected your server settings.</p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IMAP Server</label>
                  <input
                    type="text"
                    value={formData.imapHost}
                    onChange={(e) => setFormData({ ...formData, imapHost: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006B3C]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IMAP Port</label>
                  <input
                    type="text"
                    value={formData.imapPort}
                    onChange={(e) => setFormData({ ...formData, imapPort: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006B3C]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Server</label>
                  <input
                    type="text"
                    value={formData.smtpHost}
                    onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006B3C]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                  <input
                    type="text"
                    value={formData.smtpPort}
                    onChange={(e) => setFormData({ ...formData, smtpPort: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006B3C]"
                  />
                </div>
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

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Password</h2>
              <p className="text-gray-600 mb-6">Your credentials will be encrypted with AES-256.</p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your email password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006B3C] text-lg"
                  autoFocus
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔐</span>
                  <div>
                    <p className="font-medium text-green-800">Bank-Level Security</p>
                    <p className="text-sm text-green-700">Your password is encrypted. We never store plain-text passwords.</p>
                  </div>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

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
                  disabled={loading}
                  className="flex-1 py-3 bg-[#006B3C] text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? "Connecting..." : "Connect Account"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-white/70 text-sm mt-6">
          By connecting, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}