import AppShell from "@/components/layout/AppShell";
import EmailList from "@/components/inbox/EmailList";
import EmailPreview from "@/components/inbox/EmailPreview";

export default function InboxPage() {
  return (
    <AppShell>
      <div className="h-full flex flex-col md:flex-row bg-white">
        <div className="w-full md:w-1/3 border-r h-1/2 md:h-full bg-white">
          <div className="p-3 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search emails..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#006B3C]"
              />
              <button className="p-2 text-gray-500 hover:text-[#006B3C]">
                ☰
              </button>
            </div>
          </div>
          <EmailList />
        </div>
        <div className="hidden md:block flex-1 bg-white">
          <EmailPreview />
        </div>
      </div>
    </AppShell>
  );
}