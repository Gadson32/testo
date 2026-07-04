import { z } from "zod";

export const customerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

export const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),
  technicianId: z.string().optional(),
  scheduledAt: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  notes: z.string().optional(),
});

export type JobFormData = z.infer<typeof jobSchema>;

export const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;

export const invoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  dueDate: z.string().optional(),
  lineItems: z.array(
    z.object({
      description: z.string().min(1, "Description is required"),
      quantity: z.coerce.number().min(1),
      unitPrice: z.coerce.number().min(0),
    })
  ).min(1, "At least one line item is required"),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

export const treatmentReportSchema = z.object({
  findings: z.string().optional(),
  pestIdentified: z.string().optional(),
  treatmentMethod: z.string().optional(),
  productsUsed: z.string().optional(),
  recommendations: z.string().optional(),
});

export type TreatmentReportFormData = z.infer<typeof treatmentReportSchema>;
