"use client";

import Link from "next/link";

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg flex justify-around items-center p-2 z-50">
      <Link href="/inbox" className="flex flex-col items-center p-2 min-w-[60px]">
        <span className="text-xl">📥</span>
        <span className="text-xs text-gray-600">Inbox</span>
      </Link>
      <Link href="/accounts" className="flex flex-col items-center p-2 min-w-[60px]">
        <span className="text-xl">👥</span>
        <span className="text-xs text-gray-600">Accounts</span>
      </Link>
      <Link href="/compose" className="flex flex-col items-center -mt-6">
        <div className="bg-green-600 text-white px-5 py-3 rounded-full shadow-lg">
          <span className="text-2xl font-bold">+</span>
        </div>
        <span className="text-xs text-gray-600 mt-1">Compose</span>
      </Link>
      <Link href="/dashboard" className="flex flex-col items-center p-2 min-w-[60px]">
        <span className="text-xl">📊</span>
        <span className="text-xs text-gray-600">Dashboard</span>
      </Link>
      <Link href="/settings" className="flex flex-col items-center p-2 min-w-[60px]">
        <span className="text-xl">⚙️</span>
        <span className="text-xs text-gray-600">Settings</span>
      </Link>
    </div>
  );
}