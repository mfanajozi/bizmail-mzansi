import AppShell from "@/components/layout/AppShell";
import BottomNav from "@/components/layout/BottomNav";

const accounts = [
  { id: "1", email: "info@biz1.co.za", name: "Business 1", color: "bg-green-600", storage: 70 },
  { id: "2", email: "sales@biz2.co.za", name: "Sales Team", color: "bg-yellow-500", storage: 30 },
  { id: "3", email: "support@biz3.co.za", name: "Support", color: "bg-blue-600", storage: 45 },
];

export default function AccountsPage() {
  return (
    <AppShell>
      <div className="p-4 pb-20 md:pb-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Accounts</h1>
        
        <div className="space-y-4">
          {accounts.map((account) => (
            <div key={account.id} className="bg-white rounded-lg shadow-sm border p-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${account.color} flex items-center justify-center text-white font-bold`}>
                {account.email[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#1A1A1A]">{account.name}</p>
                <p className="text-sm text-gray-500">{account.email}</p>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${account.color}`} style={{ width: `${account.storage}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{account.storage}% storage used</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-medium hover:border-[#006B3C] hover:text-[#006B3C] transition-colors">
          + Add Account
        </button>
      </div>
    </AppShell>
  );
}