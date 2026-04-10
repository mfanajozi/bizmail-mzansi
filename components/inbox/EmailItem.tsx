"use client";

import { Email, useMailStore } from "@/store/useMailStore";

interface EmailItemProps {
  email: Email;
}

export default function EmailItem({ email }: EmailItemProps) {
  const selectEmail = useMailStore((s) => s.selectEmail);

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      "bg-green-600": "bg-[#006B3C]",
      "bg-yellow-500": "bg-[#FFB612]",
      "bg-blue-600": "bg-blue-600",
      "bg-red-600": "bg-[#DE3831]",
    };
    return colorMap[color] || "bg-gray-400";
  };

  return (
    <div
      onClick={() => selectEmail(email)}
      className="flex gap-3 p-3 border-b cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      <div className={`w-1 ${getColorClass(email.accountColor)} rounded-full`} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <p className="font-semibold text-gray-900 truncate">{email.sender}</p>
          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{email.date}</span>
        </div>
        <p className="text-sm font-medium text-gray-800 truncate">{email.subject}</p>
        <p className="text-xs text-gray-500 truncate mt-1">{email.preview}</p>
      </div>
    </div>
  );
}