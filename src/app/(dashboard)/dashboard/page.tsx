import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const user = await requireUser();

  const [customerCount, jobCount, openJobCount, invoiceCount] = await Promise.all([
    db.customer.count({ where: { tenantId: user.tenantId } }),
    db.job.count({ where: { tenantId: user.tenantId } }),
    db.job.count({ where: { tenantId: user.tenantId, status: { in: ["SCHEDULED", "IN_PROGRESS"] } } }),
    db.invoice.count({ where: { tenantId: user.tenantId, status: "SENT" } }),
  ]);

  const stats = [
    { label: "Total Customers", value: customerCount },
    { label: "Total Jobs", value: jobCount },
    { label: "Open Jobs", value: openJobCount },
    { label: "Pending Invoices", value: invoiceCount },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Welcome, {user.firstName || "there"}!</h2>
        <p className="text-gray-600">
          Manage your pest control operations from this dashboard. Use the sidebar to navigate between
          customers, jobs, invoices, and settings.
        </p>
      </div>
    </div>
  );
}
