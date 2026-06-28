"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { invoiceSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createInvoice(formData: FormData) {
  const user = await requireUser();

  const raw = Object.fromEntries(formData);
  const lineItemsJson = formData.get("lineItems") as string;
  const lineItems = JSON.parse(lineItemsJson);

  const data = invoiceSchema.parse({
    customerId: raw.customerId,
    dueDate: raw.dueDate,
    lineItems,
  });

  const subtotal = data.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = subtotal * 0.0; // Configure tax rate per tenant later
  const total = subtotal + tax;

  const invoiceCount = await db.invoice.count({ where: { tenantId: user.tenantId } });

  await db.invoice.create({
    data: {
      number: `INV-${String(invoiceCount + 1).padStart(4, "0")}`,
      subtotal,
      tax,
      total,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      customerId: data.customerId,
      tenantId: user.tenantId,
      lineItems: {
        create: data.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
  });

  revalidatePath("/invoices");
}

export async function updateInvoiceStatus(id: string, status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED") {
  const user = await requireUser();

  await db.invoice.update({
    where: { id, tenantId: user.tenantId },
    data: {
      status,
      paidAt: status === "PAID" ? new Date() : undefined,
    },
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
}
