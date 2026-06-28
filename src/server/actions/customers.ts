"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { customerSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createCustomer(formData: FormData) {
  const user = await requireUser();

  const raw = Object.fromEntries(formData);
  const data = customerSchema.parse(raw);

  await db.customer.create({
    data: {
      ...data,
      tenantId: user.tenantId,
    },
  });

  revalidatePath("/customers");
}

export async function updateCustomer(id: string, formData: FormData) {
  const user = await requireUser();

  const raw = Object.fromEntries(formData);
  const data = customerSchema.parse(raw);

  await db.customer.update({
    where: { id, tenantId: user.tenantId },
    data,
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
}

export async function deleteCustomer(id: string) {
  const user = await requireUser();

  await db.customer.delete({
    where: { id, tenantId: user.tenantId },
  });

  revalidatePath("/customers");
}
