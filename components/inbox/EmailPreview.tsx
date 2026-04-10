"use client";

import { useMailStore } from "@/store/useMailStore";

export default function EmailPreview() {
  const email = useMailStore((s) => s.selectedEmail);
  const clearSelection = useMailStore((s) => s.selectEmail);

  if (!email) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <span className="text-4xl mb-2 block">📧</span>
          <p>Select an email to read</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 overflow-y-auto h-full">
      <div className="md:hidden mb-4">
        <button 
          onClick={() => clearSelection(null)}
          className="text-green-600 font-medium flex items-center gap-1"
        >
          ← Back
        </button>
      </div>
      
      <h2 className="text-xl font-bold mb-2 text-gray-900">{email.subject}</h2>
      <p className="text-sm text-gray-500 mb-4">{email.sender}</p>
      
      <div className="prose max-w-none">
        <div 
          className="text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: email.body }}
        />
      </div>

      <div className="mt-6 flex gap-3 flex-wrap">
        <button className="bg-[#006B3C] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors">
          Reply
        </button>
        <button className="border border-gray-300 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors">
          Forward
        </button>
      </div>
    </div>
  );
}