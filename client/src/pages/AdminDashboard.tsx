/**
 * @file AdminDashboard.tsx
 * @description Overview page for the Super Admin Portal.
 * @systemic_role Displays high-level KPI cards and chart placeholders.
 */
export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, Super Admin.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {['Total Revenue', 'Active Orders', 'Total Users', 'Low Stock Alerts'].map((title) => (
          <div key={title} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">--</p>
            <p className="mt-1 text-xs text-gray-400">Data loading in Phase 5.2</p>
          </div>
        ))}
      </div>
    </div>
  );
}