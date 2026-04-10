"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      <h1 className="text-xl font-bold text-green-700">Mzansi BizMail</h1>
      <nav className="space-y-2">
        <Link href="/inbox" className="block w-full text-left p-2 rounded hover:bg-gray-100 font-medium">
          Inbox
        </Link>
        <button className="w-full text-left p-2 rounded hover:bg-gray-100">
          Sent
        </button>
        <button className="w-full text-left p-2 rounded hover:bg-gray-100">
          Drafts
        </button>
      </nav>
      <div className="flex-1">
        <h2 className="text-sm font-semibold mt-4 text-gray-600">Accounts</h2>
        <div className="space-y-2 mt-2">
          <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer">
            <span className="w-3 h-3 rounded-full bg-green-600"></span>
            <span className="text-sm">info@biz1.co.za</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-sm">sales@biz2.co.za</span>
          </div>
        </div>
      </div>
    </div>
  );
}