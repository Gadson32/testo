import { requireOwner } from "@/lib/auth";
import { PLANS } from "@/lib/stripe";

export default async function SettingsPage() {
  const user = await requireOwner();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Settings</h1>

      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Company Info</h2>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p><span className="font-medium">Company:</span> {user.tenant.name}</p>
            <p><span className="font-medium">Plan:</span> {user.tenant.plan}</p>
            <p><span className="font-medium">Slug:</span> {user.tenant.slug}</p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Subscription Plans</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {Object.entries(PLANS).map(([key, plan]) => (
              <div
                key={key}
                className={`rounded-lg border p-4 ${
                  user.tenant.plan === key ? "border-green-500 bg-green-50" : "border-gray-200"
                }`}
              >
                <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                <ul className="mt-2 space-y-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-sm text-gray-600">
                      {feature}
                    </li>
                  ))}
                </ul>
                {user.tenant.plan === key && (
                  <p className="mt-3 text-sm font-medium text-green-600">Current Plan</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
