import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing headers" }, { status: 400 });
  }

  let event: { type: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  switch (event.type) {
    case "user.created": {
      const { id, email_addresses, first_name, last_name } = event.data as {
        id: string;
        email_addresses: { email_address: string }[];
        first_name: string;
        last_name: string;
      };
      const email = email_addresses[0]?.email_address;
      if (!email) break;

      const slug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
      const tenant = await db.tenant.create({
        data: {
          name: `${first_name || ""} ${last_name || ""}`.trim() || slug,
          slug: `${slug}-${Date.now()}`,
        },
      });

      await db.user.create({
        data: {
          clerkId: id,
          email,
          firstName: first_name,
          lastName: last_name,
          role: "OWNER",
          tenantId: tenant.id,
        },
      });
      break;
    }

    case "user.updated": {
      const { id, email_addresses, first_name, last_name } = event.data as {
        id: string;
        email_addresses: { email_address: string }[];
        first_name: string;
        last_name: string;
      };
      await db.user.updateMany({
        where: { clerkId: id },
        data: {
          email: email_addresses[0]?.email_address,
          firstName: first_name,
          lastName: last_name,
        },
      });
      break;
    }

    case "user.deleted": {
      const { id } = event.data as { id: string };
      await db.user.deleteMany({ where: { clerkId: id } });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
