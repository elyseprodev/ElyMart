import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSession,
  isAdminLoginConfigured,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FAILED_ATTEMPTS = 6;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
type AttemptRecord = { count: number; startedAt: number; blockedUntil?: number };
const attemptsByAddress = new Map<string, AttemptRecord>();

type LoginPayload = { email?: unknown; password?: unknown };

function addressKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "local";
}

function getAttemptRecord(address: string, now: number): AttemptRecord {
  const existing = attemptsByAddress.get(address);
  if (!existing || now - existing.startedAt > ATTEMPT_WINDOW_MS || (existing.blockedUntil && existing.blockedUntil <= now)) {
    const fresh = { count: 0, startedAt: now };
    attemptsByAddress.set(address, fresh);
    return fresh;
  }
  return existing;
}

function recordFailure(address: string, now: number) {
  if (attemptsByAddress.size > 1000) {
    for (const [key, value] of attemptsByAddress) {
      if (now - value.startedAt > ATTEMPT_WINDOW_MS && (!value.blockedUntil || value.blockedUntil <= now)) attemptsByAddress.delete(key);
    }
  }
  const record = getAttemptRecord(address, now);
  record.count += 1;
  if (record.count >= MAX_FAILED_ATTEMPTS) record.blockedUntil = now + ATTEMPT_WINDOW_MS;
}

function noStoreJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function POST(request: Request) {
  if (!isAdminLoginConfigured()) {
    return noStoreJson({ error: "Admin sign-in is not configured. Set the server environment values from .env.example, then restart the app." }, 503);
  }

  const address = addressKey(request);
  const now = Date.now();
  const attemptRecord = getAttemptRecord(address, now);
  if (attemptRecord.blockedUntil && attemptRecord.blockedUntil > now) {
    const retryAfter = Math.ceil((attemptRecord.blockedUntil - now) / 1000);
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please wait and try again." },
      { status: 429, headers: { "Cache-Control": "no-store, max-age=0", "Retry-After": String(retryAfter) } },
    );
  }

  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return noStoreJson({ error: "Send sign-in details as JSON." }, 415);
  }

  let payload: LoginPayload;
  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return noStoreJson({ error: "The sign-in request was not valid." }, 400);
  }

  if (
    typeof payload.email !== "string" ||
    typeof payload.password !== "string" ||
    payload.email.length > 254 ||
    payload.password.length > 1024
  ) {
    return noStoreJson({ error: "Enter a valid email and password." }, 400);
  }

  const admin = verifyAdminCredentials(payload.email, payload.password);
  if (!admin) {
    recordFailure(address, now);
    return noStoreJson({ error: "Email or password is incorrect." }, 401);
  }

  attemptsByAddress.delete(address);
  const response = noStoreJson({ ok: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSession(admin.email),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
