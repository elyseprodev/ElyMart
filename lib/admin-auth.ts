import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "elymart_admin_session";
export const ADMIN_EMAIL_CHALLENGE_COOKIE = "elymart_admin_email_challenge";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
export const ADMIN_EMAIL_CHALLENGE_MAX_AGE_SECONDS = 60 * 10;

const SESSION_VERSION = 1;

type AdminSessionPayload = {
  email: string;
  expiresAt: number;
  version: number;
};

type AdminEnvironment = {
  email: string;
  password: string;
  sessionSecret: string;
};

function getAdminEnvironment(): AdminEnvironment | null {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "";
  const sessionSecret = process.env.ADMIN_SESSION_SECRET ?? "";

  if (!email || !password || sessionSecret.length < 32) return null;
  return { email, password, sessionSecret };
}

function secureStringEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminLoginConfigured() {
  return getAdminEnvironment() !== null;
}

export function verifyAdminCredentials(email: string, password: string) {
  const environment = getAdminEnvironment();
  if (!environment) return null;

  const emailMatches = secureStringEqual(email.trim().toLowerCase(), environment.email);
  const passwordMatches = secureStringEqual(password, environment.password);
  return emailMatches && passwordMatches ? { email: environment.email } : null;
}

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAdminSession(email: string) {
  const environment = getAdminEnvironment();
  if (!environment || !secureStringEqual(email, environment.email)) {
    throw new Error("Admin session configuration is unavailable.");
  }

  const payload: AdminSessionPayload = {
    email: environment.email,
    expiresAt: Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
    version: SESSION_VERSION,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${signPayload(encodedPayload, environment.sessionSecret)}`;
}

export function verifyAdminSession(token: string | undefined) {
  if (!token) return null;
  const environment = getAdminEnvironment();
  if (!environment) return null;

  const [encodedPayload, signature, extra] = token.split(".");
  if (!encodedPayload || !signature || extra) return null;

  const expectedSignature = signPayload(encodedPayload, environment.sessionSecret);
  if (!secureStringEqual(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as AdminSessionPayload;
    if (
      payload.version !== SESSION_VERSION ||
      typeof payload.email !== "string" ||
      !secureStringEqual(payload.email, environment.email) ||
      !Number.isFinite(payload.expiresAt) ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }
    return { email: environment.email, expiresAt: payload.expiresAt };
  } catch {
    return null;
  }
}

export function createAdminEmailChallengeToken(challengeId: string) {
  const environment = getAdminEnvironment();
  if (!environment) throw new Error("Admin session configuration is unavailable.");
  return `${challengeId}.${signPayload(`email-challenge:${challengeId}`, environment.sessionSecret)}`;
}

export function verifyAdminEmailChallengeToken(token: string | undefined) {
  if (!token) return null;
  const environment = getAdminEnvironment();
  if (!environment) return null;

  const [challengeId, signature, extra] = token.split(".");
  if (!challengeId || !signature || extra || !/^[a-f0-9-]{36}$/i.test(challengeId)) return null;
  const expected = signPayload(`email-challenge:${challengeId}`, environment.sessionSecret);
  return secureStringEqual(signature, expected) ? challengeId : null;
}

export function digestAdminEmailCode(challengeId: string, email: string, code: string) {
  const environment = getAdminEnvironment();
  if (!environment) throw new Error("Admin session configuration is unavailable.");
  return createHmac("sha256", environment.sessionSecret)
    .update(`elymart-admin-email-code-v1:${challengeId}:${email}:${code}`)
    .digest("hex");
}

export function secureAdminStringEqual(left: string, right: string) {
  return secureStringEqual(left, right);
}
