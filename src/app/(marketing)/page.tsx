import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-green-700">Sentinel Field</h1>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="text-5xl font-bold tracking-tight text-gray-900">
            Pest Control Operations,
            <br />
            <span className="text-green-600">Fully Under Control</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Manage customers, schedule jobs, dispatch technicians, generate invoices, and grow your
            pest control business — all from one platform.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="rounded-lg bg-green-600 px-8 py-3 text-lg font-medium text-white hover:bg-green-700"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="rounded-lg border border-gray-300 px-8 py-3 text-lg font-medium text-gray-700 hover:bg-gray-50"
            >
              See Features
            </Link>
          </div>
        </section>

        <section id="features" className="border-t border-gray-100 bg-gray-50 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <h3 className="mb-12 text-center text-3xl font-bold text-gray-900">
              Everything Your Pest Control Business Needs
            </h3>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Customer Management", desc: "Track all customer info, service history, and contact details in one place." },
                { title: "Job Scheduling", desc: "Schedule and assign jobs to technicians with GPS navigation to job sites." },
                { title: "Invoicing & Payments", desc: "Generate invoices, accept payments via Stripe, and track outstanding balances." },
                { title: "Treatment Reports", desc: "Document findings, treatments applied, and recommendations for every job." },
                { title: "Multi-Tenant SaaS", desc: "Each pest control company gets their own isolated workspace with role-based access." },
                { title: "SMS & Email Alerts", desc: "Automated appointment reminders and invoice notifications via Twilio and email." },
              ].map((feature) => (
                <div key={feature.title} className="rounded-lg border border-gray-200 bg-white p-6">
                  <h4 className="text-lg font-semibold text-gray-900">{feature.title}</h4>
                  <p className="mt-2 text-sm text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <h3 className="text-3xl font-bold text-gray-900">Simple, Transparent Pricing</h3>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {[
                { name: "Starter", price: "$29", features: ["50 customers", "1 technician", "Basic reports", "Email support"] },
                { name: "Professional", price: "$79", features: ["500 customers", "5 technicians", "Advanced reports", "SMS alerts", "Priority support"] },
                { name: "Enterprise", price: "$199", features: ["Unlimited customers", "Unlimited technicians", "Custom reports", "API access", "Dedicated support"] },
              ].map((plan) => (
                <div key={plan.name} className={`rounded-lg border p-8 ${plan.name === "Professional" ? "border-green-500 shadow-lg" : "border-gray-200"}`}>
                  <h4 className="text-xl font-bold text-gray-900">{plan.name}</h4>
                  <p className="mt-4 text-4xl font-bold text-gray-900">{plan.price}<span className="text-lg font-normal text-gray-500">/mo</span></p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="text-sm text-gray-600">{f}</li>
                    ))}
                  </ul>
                  <Link
                    href="/sign-up"
                    className={`mt-8 block rounded-lg px-4 py-2 text-center text-sm font-medium ${
                      plan.name === "Professional"
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-500">
        Sentinel Field &copy; {new Date().getFullYear()}. All rights reserved.
      </footer>
    </div>
  );
}
