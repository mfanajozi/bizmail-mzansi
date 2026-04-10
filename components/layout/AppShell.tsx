"use client";

import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#F7F7F7] text-[#1A1A1A]">
      <div className="hidden md:block w-64 border-r bg-white">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}