"use client";

import { useMailStore } from "@/store/useMailStore";
import EmailItem from "./EmailItem";

export default function EmailList() {
  const emails = useMailStore((s) => s.emails);

  return (
    <div className="overflow-y-auto h-full">
      {emails.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          No emails yet
        </div>
      ) : (
        emails.map((email) => (
          <EmailItem key={email.id} email={email} />
        ))
      )}
    </div>
  );
}