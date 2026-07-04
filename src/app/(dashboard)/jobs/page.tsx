import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

export default async function JobsPage() {
  const user = await requireUser();

  const jobs = await db.job.findMany({
    where: { tenantId: user.tenantId },
    include: { customer: true, technician: true },
    orderBy: { scheduledAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <Link
          href="/jobs/new"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Create Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No jobs yet. Create your first job to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job: { id: string; title: string; status: string; scheduledAt: Date | null; address: string | null; city: string | null; state: string | null; customer: { firstName: string; lastName: string }; technician: { firstName: string | null } | null }) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-green-300 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{job.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {job.customer.firstName} {job.customer.lastName}
                  </p>
                  {job.scheduledAt && (
                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(job.scheduledAt).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[job.status]}`}>
                  {job.status.replace("_", " ")}
                </span>
              </div>
              {job.address && (
                <p className="mt-2 text-sm text-gray-500">
                  {job.address}, {job.city} {job.state}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
