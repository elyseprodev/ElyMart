import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";
import { normalizeWhatsAppPhone, readMarketplaceSettings, writeMarketplaceSettings } from "@/lib/marketplace-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function GET() {
  try {
    const settings = await readMarketplaceSettings();
    return response(settings);
  } catch {
    return response({ error: "WhatsApp support settings are temporarily unavailable." }, 503);
  }
}

export async function PUT(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return response({ error: "Cross-site settings updates are not allowed." }, 403);
  }

  const cookieStore = await cookies();
  const session = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) return response({ error: "Admin sign-in is required to update support settings." }, 401);

  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return response({ error: "Send the WhatsApp number as JSON." }, 415);
  }

  let payload: { whatsappPhone?: unknown };
  try {
    payload = (await request.json()) as { whatsappPhone?: unknown };
  } catch {
    return response({ error: "The settings request was not valid." }, 400);
  }

  if (typeof payload.whatsappPhone !== "string" || payload.whatsappPhone.length > 40) {
    return response({ error: "Enter a valid international WhatsApp number." }, 400);
  }

  const normalizedPhone = normalizeWhatsAppPhone(payload.whatsappPhone);
  if (normalizedPhone === null) {
    return response({ error: "Enter 8–15 digits including the country code, for example +250 7XX XXX XXX." }, 400);
  }

  try {
    await writeMarketplaceSettings({ whatsappPhone: normalizedPhone });
    return response({ whatsappPhone: normalizedPhone });
  } catch {
    return response({ error: "Could not save the support number. Check that the server data folder is writable." }, 503);
  }
}
