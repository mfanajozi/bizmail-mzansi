"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";

export default function SettingsPage() {
  const [oooEnabled, setOooEnabled] = useState(false);
  const [oooMessage, setOooMessage] = useState("");

  return (
    <AppShell>
      <div className="p-4 pb-20 md:pb-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Settings</h1>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold mb-4">Out of Office</h2>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700">Enable Auto-Reply</span>
              <button
                onClick={() => setOooEnabled(!oooEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${oooEnabled ? 'bg-[#006B3C]' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${oooEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {oooEnabled && (
              <div>
                <label className="block text-sm text-gray-600 mb-2">Auto-reply message</label>
                <textarea
                  value={oooMessage}
                  onChange={(e) => setOooMessage(e.target.value)}
                  className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:border-[#006B3C]"
                  rows={4}
                  placeholder="Enter your out of office message..."
                />
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold mb-4">Sync Settings</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Sync Interval</span>
                <select className="p-2 border rounded-lg text-sm">
                  <option>Every 5 minutes</option>
                  <option>Every 15 minutes</option>
                  <option>Every 30 minutes</option>
                  <option>Manual</option>
                </select>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Email Retention</span>
                <select className="p-2 border rounded-lg text-sm">
                  <option>30 days</option>
                  <option>60 days</option>
                  <option>90 days</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold mb-4">Security</h2>
            <div className="space-y-3">
              <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
                Change Master Password
              </button>
              <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
                Enable Two-Factor Authentication
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold mb-4">Account</h2>
            <div className="space-y-3">
              <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 text-[#DE3831]">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}