"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { jobSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createJob(formData: FormData) {
  const user = await requireUser();

  const raw = Object.fromEntries(formData);
  const data = jobSchema.parse(raw);

  await db.job.create({
    data: {
      title: data.title,
      description: data.description,
      customerId: data.customerId,
      technicianId: data.technicianId || null,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      notes: data.notes,
      tenantId: user.tenantId,
    },
  });

  revalidatePath("/jobs");
}

export async function updateJobStatus(id: string, status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED") {
  const user = await requireUser();

  await db.job.update({
    where: { id, tenantId: user.tenantId },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : undefined,
    },
  });

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
}

export async function deleteJob(id: string) {
  const user = await requireUser();

  await db.job.delete({
    where: { id, tenantId: user.tenantId },
  });

  revalidatePath("/jobs");
}
