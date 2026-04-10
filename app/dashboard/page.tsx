import AppShell from "@/components/layout/AppShell";

const accounts = [
  { id: "1", name: "Business 1", email: "info@biz1.co.za", storage: 70, syncStatus: "Synced", lastSync: "2 min ago" },
  { id: "2", name: "Sales Team", email: "sales@biz2.co.za", storage: 30, syncStatus: "Synced", lastSync: "5 min ago" },
  { id: "3", name: "Support", email: "support@biz3.co.za", storage: 45, syncStatus: "Syncing", lastSync: "Just now" },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="p-4 pb-20 md:pb-4">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Email Health Dashboard</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold mb-4">Storage Usage</h2>
            {accounts.map((account) => (
              <div key={account.id} className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{account.name}</span>
                  <span className="font-medium">{account.storage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${account.storage > 70 ? 'bg-[#DE3831]' : 'bg-[#006B3C]'}`} 
                    style={{ width: `${account.storage}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold mb-4">Sync Status</h2>
            {accounts.map((account) => (
              <div key={account.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-sm text-gray-500">{account.email}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${account.syncStatus === 'Synced' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {account.syncStatus}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{account.lastSync}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[#006B3C]">3</p>
              <p className="text-sm text-gray-500">Accounts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#FFB612]">127</p>
              <p className="text-sm text-gray-500">Unread</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#DE3831]">30</p>
              <p className="text-sm text-gray-500">Days Sync</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}