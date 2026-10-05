import { randomInt, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_EMAIL_CHALLENGE_COOKIE,
  ADMIN_EMAIL_CHALLENGE_MAX_AGE_SECONDS,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminEmailChallengeToken,
  createAdminSession,
  digestAdminEmailCode,
  isAdminLoginConfigured,
  secureAdminStringEqual,
  verifyAdminCredentials,
  verifyAdminEmailChallengeToken,
} from "@/lib/admin-auth";
import { isAdminEmailDeliveryConfigured, sendAdminVerificationCode } from "@/lib/admin-mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FAILED_PASSWORD_ATTEMPTS = 6;
const PASSWORD_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const EMAIL_CODE_LIFETIME_MS = 10 * 60 * 1000;
const MAX_EMAIL_CODE_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_RESENDS_PER_CHALLENGE = 3;

type AttemptRecord = { count: number; startedAt: number; blockedUntil?: number };
type PendingEmailChallenge = {
  id: string;
  email: string;
  digest: string;
  expiresAt: number;
  attemptsRemaining: number;
  lastSentAt: number;
  resendCount: number;
};
type AuthPayload = { action?: unknown; email?: unknown; password?: unknown; code?: unknown };

const passwordAttemptsByAddress = new Map<string, AttemptRecord>();
const challengesById = new Map<string, PendingEmailChallenge>();
const activeChallengeByEmail = new Map<string, string>();

function addressKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "local";
}

function getAttemptRecord(address: string, now: number): AttemptRecord {
  const existing = passwordAttemptsByAddress.get(address);
  if (!existing || now - existing.startedAt > PASSWORD_ATTEMPT_WINDOW_MS || (existing.blockedUntil && existing.blockedUntil <= now)) {
    const fresh: AttemptRecord = { count: 0, startedAt: now };
    passwordAttemptsByAddress.set(address, fresh);
    return fresh;
  }
  return existing;
}

function recordPasswordFailure(address: string, now: number) {
  if (passwordAttemptsByAddress.size > 1000) {
    for (const [key, value] of passwordAttemptsByAddress) {
      if (now - value.startedAt > PASSWORD_ATTEMPT_WINDOW_MS && (!value.blockedUntil || value.blockedUntil <= now)) {
        passwordAttemptsByAddress.delete(key);
      }
    }
  }
  const record = getAttemptRecord(address, now);
  record.count += 1;
  if (record.count >= MAX_FAILED_PASSWORD_ATTEMPTS) record.blockedUntil = now + PASSWORD_ATTEMPT_WINDOW_MS;
}

function removeChallenge(challenge: PendingEmailChallenge) {
  challengesById.delete(challenge.id);
  if (activeChallengeByEmail.get(challenge.email) === challenge.id) activeChallengeByEmail.delete(challenge.email);
}

function cleanExpiredChallenges(now: number) {
  for (const challenge of challengesById.values()) {
    if (challenge.expiresAt <= now) removeChallenge(challenge);
  }
}

function noStoreJson(body: Record<string, unknown>, status = 200, extraHeaders?: Record<string, string>) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", ...extraHeaders },
  });
}

function clearChallengeCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_EMAIL_CHALLENGE_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/admin/login",
    maxAge: 0,
  });
}

function setChallengeCookie(response: NextResponse, challengeId: string) {
  response.cookies.set({
    name: ADMIN_EMAIL_CHALLENGE_COOKIE,
    value: createAdminEmailChallengeToken(challengeId),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/admin/login",
    maxAge: ADMIN_EMAIL_CHALLENGE_MAX_AGE_SECONDS,
  });
}

function setSessionCookie(response: NextResponse, email: string) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSession(email),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
}

async function startEmailChallenge(email: string) {
  const now = Date.now();
  cleanExpiredChallenges(now);

  const previousId = activeChallengeByEmail.get(email);
  const previousChallenge = previousId ? challengesById.get(previousId) : undefined;
  if (previousChallenge) removeChallenge(previousChallenge);

  const id = randomUUID();
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const challenge: PendingEmailChallenge = {
    id,
    email,
    digest: digestAdminEmailCode(id, email, code),
    expiresAt: now + EMAIL_CODE_LIFETIME_MS,
    attemptsRemaining: MAX_EMAIL_CODE_ATTEMPTS,
    lastSentAt: now,
    resendCount: 0,
  };

  await sendAdminVerificationCode(email, code);
  challengesById.set(id, challenge);
  activeChallengeByEmail.set(email, id);
  return challenge;
}

function readActiveChallenge(token: string | undefined) {
  const id = verifyAdminEmailChallengeToken(token);
  if (!id) return null;

  const challenge = challengesById.get(id);
  if (!challenge || challenge.expiresAt <= Date.now() || activeChallengeByEmail.get(challenge.email) !== id) {
    if (challenge) removeChallenge(challenge);
    return null;
  }
  return challenge;
}

async function handlePasswordStep(request: Request, payload: AuthPayload) {
  if (!isAdminLoginConfigured()) {
    return noStoreJson({ error: "Admin sign-in is not configured. Set the server environment values from .env.example, then restart the app." }, 503);
  }
  if (!isAdminEmailDeliveryConfigured()) {
    return noStoreJson({ error: "Email verification is not configured. Set the SMTP environment values in .env.local before signing in." }, 503);
  }

  const address = addressKey(request);
  const now = Date.now();
  const attemptRecord = getAttemptRecord(address, now);
  if (attemptRecord.blockedUntil && attemptRecord.blockedUntil > now) {
    const retryAfter = Math.ceil((attemptRecord.blockedUntil - now) / 1000);
    return noStoreJson({ error: "Too many sign-in attempts. Please wait and try again." }, 429, { "Retry-After": String(retryAfter) });
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
    recordPasswordFailure(address, now);
    return noStoreJson({ error: "Email or password is incorrect." }, 401);
  }

  passwordAttemptsByAddress.delete(address);
  try {
    const challenge = await startEmailChallenge(admin.email);
    const response = noStoreJson({ verificationRequired: true, email: admin.email, expiresInSeconds: EMAIL_CODE_LIFETIME_MS / 1000 });
    setChallengeCookie(response, challenge.id);
    return response;
  } catch {
    return noStoreJson({ error: "Could not send the verification email. Check the SMTP settings and try again." }, 503);
  }
}

function handleCodeVerification(challengeToken: string | undefined, payload: AuthPayload) {
  if (!isAdminLoginConfigured()) {
    return noStoreJson({ error: "Admin sign-in is not configured. Set the server environment values from .env.example, then restart the app." }, 503);
  }

  const challenge = readActiveChallenge(challengeToken);
  if (!challenge) {
    const response = noStoreJson({ error: "This verification code expired. Sign in again to request a new one." }, 401);
    clearChallengeCookie(response);
    return response;
  }

  const code = typeof payload.code === "string" ? payload.code : "";
  const submittedDigest = /^\d{6}$/.test(code) ? digestAdminEmailCode(challenge.id, challenge.email, code) : "invalid-code-format";
  if (!secureAdminStringEqual(submittedDigest, challenge.digest)) {
    challenge.attemptsRemaining -= 1;
    if (challenge.attemptsRemaining <= 0) {
      removeChallenge(challenge);
      const response = noStoreJson({ error: "Too many incorrect codes. Sign in again to request a new one." }, 429);
      clearChallengeCookie(response);
      return response;
    }
    return noStoreJson({ error: "The verification code is incorrect or expired." }, 401);
  }

  removeChallenge(challenge);
  const response = noStoreJson({ ok: true });
  clearChallengeCookie(response);
  setSessionCookie(response, challenge.email);
  return response;
}

async function handleResend(challengeToken: string | undefined) {
  const challenge = readActiveChallenge(challengeToken);
  if (!challenge) {
    const response = noStoreJson({ error: "This verification request expired. Sign in again." }, 401);
    clearChallengeCookie(response);
    return response;
  }

  if (!isAdminEmailDeliveryConfigured()) {
    return noStoreJson({ error: "Email verification is not configured. Check the SMTP environment values." }, 503);
  }

  if (challenge.resendCount >= MAX_RESENDS_PER_CHALLENGE) {
    return noStoreJson({ error: "You have reached the resend limit. Sign in again to start a new verification." }, 429);
  }

  const now = Date.now();
  const remainingWait = RESEND_COOLDOWN_MS - (now - challenge.lastSentAt);
  if (remainingWait > 0) {
    const retryAfter = Math.ceil(remainingWait / 1000);
    return noStoreJson({ error: `Please wait ${retryAfter} seconds before requesting another code.` }, 429, { "Retry-After": String(retryAfter) });
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  try {
    await sendAdminVerificationCode(challenge.email, code);
  } catch {
    return noStoreJson({ error: "Could not resend the verification email. Check the SMTP settings and try again." }, 503);
  }

  challenge.digest = digestAdminEmailCode(challenge.id, challenge.email, code);
  challenge.expiresAt = now + EMAIL_CODE_LIFETIME_MS;
  challenge.attemptsRemaining = MAX_EMAIL_CODE_ATTEMPTS;
  challenge.lastSentAt = now;
  challenge.resendCount += 1;

  const response = noStoreJson({ verificationRequired: true, email: challenge.email, expiresInSeconds: EMAIL_CODE_LIFETIME_MS / 1000 });
  setChallengeCookie(response, challenge.id);
  return response;
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return noStoreJson({ error: "Send sign-in details as JSON." }, 415);
  }

  let payload: AuthPayload;
  try {
    payload = (await request.json()) as AuthPayload;
  } catch {
    return noStoreJson({ error: "The sign-in request was not valid." }, 400);
  }

  const action = payload.action ?? "password";
  if (action === "password") return handlePasswordStep(request, payload);
  if (action !== "verify" && action !== "resend") return noStoreJson({ error: "Unknown sign-in step." }, 400);

  const cookieStore = await cookies();
  const challengeToken = cookieStore.get(ADMIN_EMAIL_CHALLENGE_COOKIE)?.value;
  if (action === "verify") return handleCodeVerification(challengeToken, payload);
  return handleResend(challengeToken);
}
