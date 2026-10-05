"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

type AuthResponse = {
  error?: string;
  email?: string;
  verificationRequired?: boolean;
};

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [step, setStep] = useState<"credentials" | "verification">("credentials");
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "password", email, password }),
      });
      const result = (await response.json()) as AuthResponse;
      if (!response.ok) {
        setError(result.error || "Sign-in failed. Check your details and try again.");
        return;
      }
      setPassword("");
      setVerificationEmail(result.email || email);
      setStep("verification");
      setNotice("A one-time verification code was sent to your admin email.");
    } catch {
      setError("Could not connect to the sign-in service. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", code: verificationCode }),
      });
      const result = (await response.json()) as AuthResponse;
      if (!response.ok) {
        setError(result.error || "The verification code could not be checked.");
        return;
      }
      setVerificationCode("");
      window.location.assign("/admin");
    } catch {
      setError("Could not connect to the verification service. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    if (busy || resendBusy) return;
    setResendBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend" }),
      });
      const result = (await response.json()) as AuthResponse;
      if (!response.ok) {
        setError(result.error || "Could not resend the verification code.");
        return;
      }
      setVerificationCode("");
      setNotice("A new verification code was sent. The previous code no longer works.");
    } catch {
      setError("Could not connect to the email service. Please try again.");
    } finally {
      setResendBusy(false);
    }
  }

  function returnToCredentials() {
    setStep("credentials");
    setVerificationCode("");
    setError("");
    setNotice("");
  }

  const handleSubmit = step === "credentials" ? submitCredentials : submitVerification;

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <Link className="admin-login-store-link" href="/">← Back to ElyMart</Link>
        <div className="admin-login-mark"><ShieldCheck size={24} strokeWidth={1.8} /></div>
        <span className="admin-login-eyebrow">ELYMART · ADMIN ACCESS</span>
        <h1 id="admin-login-title">{step === "credentials" ? "Welcome back." : "Check your email."}</h1>
        <p className="admin-login-intro">
          {step === "credentials"
            ? "Sign in with your configured super-admin account to open the marketplace console."
            : <>Enter the six-digit code sent to <strong>{maskEmail(verificationEmail)}</strong>. It expires in 10 minutes.</>}
        </p>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          {step === "credentials" ? (
            <>
              <label htmlFor="admin-login-email">Admin email</label>
              <div className="admin-login-input-wrap">
                <Mail size={17} aria-hidden="true" />
                <input
                  id="admin-login-email"
                  type="email"
                  name="email"
                  autoComplete="username"
                  inputMode="email"
                  maxLength={254}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@example.com"
                />
              </div>

              <label htmlFor="admin-login-password">Password</label>
              <div className="admin-login-input-wrap">
                <LockKeyhole size={17} aria-hidden="true" />
                <input
                  id="admin-login-password"
                  type={passwordVisible ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  maxLength={1024}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                />
                <button
                  className="admin-login-password-toggle"
                  type="button"
                  aria-label={passwordVisible ? "Hide password" : "Show password"}
                  onClick={() => setPasswordVisible((visible) => !visible)}
                >
                  {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </>
          ) : (
            <>
              <label htmlFor="admin-verification-code">Email verification code</label>
              <div className="admin-login-input-wrap">
                <Mail size={17} aria-hidden="true" />
                <input
                  id="admin-verification-code"
                  type="text"
                  name="verification-code"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  aria-describedby="admin-code-help"
                />
              </div>
              <small className="admin-login-code-help" id="admin-code-help">Check your inbox and spam folder. You have five attempts.</small>
              <button className="admin-login-change-email" type="button" onClick={returnToCredentials}>Use a different email or password</button>
            </>
          )}

          {notice && <p className="admin-login-notice" role="status">{notice}</p>}
          {error && <p className="admin-login-error" role="alert">{error}</p>}
          <button className="admin-login-submit" type="submit" disabled={busy || resendBusy}>
            {busy ? (step === "credentials" ? "Checking sign-in…" : "Verifying code…") : (step === "credentials" ? "Continue to email verification" : "Verify email & sign in")}
            <ArrowRight size={16} />
          </button>
          {step === "verification" && <button className="admin-login-resend" type="button" onClick={resendCode} disabled={busy || resendBusy}>{resendBusy ? "Sending a new code…" : "Resend verification code"}</button>}
        </form>

        <div className="admin-login-security"><LockKeyhole size={14} /> Password and email code are checked on the server. Codes are one-use and expire after 10 minutes.</div>
        <p className="admin-login-footer">Admin access is private. If you are not the marketplace administrator, return to the shop.</p>
      </section>
    </main>
  );
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const visible = name.slice(0, 1);
  return `${visible}${"•".repeat(Math.min(5, Math.max(2, name.length - 1)))}@${domain}`;
}
