"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, type CustomerFormData } from "@/lib/validations";

interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormData>;
  action: (formData: FormData) => Promise<void>;
  submitLabel?: string;
}

export function CustomerForm({ defaultValues, action, submitLabel = "Save Customer" }: CustomerFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  });

  async function onSubmit(data: CustomerFormData) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, String(value));
    });
    await action(formData);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name *</label>
          <input {...register("firstName")} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name *</label>
          <input {...register("lastName")} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input {...register("email")} type="email" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input {...register("phone")} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <input {...register("address")} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">City</label>
          <input {...register("city")} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">State</label>
          <input {...register("state")} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">ZIP</label>
          <input {...register("zip")} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea {...register("notes")} rows={3} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
