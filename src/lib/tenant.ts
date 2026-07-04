import { db } from "./db";
import { requireUser } from "./auth";

export async function getTenantId(): Promise<string> {
  const user = await requireUser();
  return user.tenantId;
}

export async function withTenantScope<T>(
  query: (tenantId: string) => Promise<T>
): Promise<T> {
  const tenantId = await getTenantId();
  return query(tenantId);
}
