export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export type PlanKey = "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

export type JobStatusKey = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type InvoiceStatusKey = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";

export type UserRole = "OWNER" | "TECHNICIAN" | "CUSTOMER";
