"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

export default function ComposePage() {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const handleSend = () => {
    console.log("Sending email:", { to, subject, body });
    router.push("/inbox");
  };

  return (
    <AppShell>
      <div className="h-full flex flex-col bg-white">
        <div className="flex items-center justify-between p-4 border-b">
          <button onClick={() => router.back()} className="text-[#006B3C] font-medium">
            ✕ Cancel
          </button>
          <button 
            onClick={handleSend}
            disabled={!to || !subject}
            className="px-4 py-2 bg-[#006B3C] text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center border-b pb-2">
              <span className="text-gray-500 w-12">To:</span>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.co.za"
                className="flex-1 outline-none"
              />
            </div>
            <div className="flex items-center border-b pb-2">
              <span className="text-gray-500 w-12">Subject:</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject..."
                className="flex-1 outline-none"
              />
            </div>
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message..."
            className="w-full mt-4 p-2 outline-none resize-none h-[calc(100%-150px)]"
          />
        </div>

        <div className="flex items-center gap-4 p-4 border-t">
          <button className="text-gray-500 hover:text-[#006B3C]">
            📎 Attachment
          </button>
          <button className="text-gray-500 hover:text-[#006B3C]">
            B
          </button>
          <button className="text-gray-500 hover:text-[#006B3C]">
            I
          </button>
        </div>
      </div>
    </AppShell>
  );
}