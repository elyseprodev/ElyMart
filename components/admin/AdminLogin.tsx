"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error || "Sign-in failed. Check your details and try again.");
        return;
      }
      setPassword("");
      window.location.assign("/admin");
    } catch {
      setError("Could not connect to the sign-in service. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <Link className="admin-login-store-link" href="/">← Back to ElyMart</Link>
        <div className="admin-login-mark"><ShieldCheck size={24} strokeWidth={1.8} /></div>
        <span className="admin-login-eyebrow">ELYMART · ADMIN ACCESS</span>
        <h1 id="admin-login-title">Welcome back.</h1>
        <p className="admin-login-intro">Sign in with your configured super-admin account to open the marketplace console.</p>

        <form className="admin-login-form" onSubmit={submit}>
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

          {error && <p className="admin-login-error" role="alert">{error}</p>}
          <button className="admin-login-submit" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in securely"}<ArrowRight size={16} />
          </button>
        </form>

        <div className="admin-login-security"><LockKeyhole size={14} /> Password is checked on the server and never stored in the browser.</div>
        <p className="admin-login-footer">Admin access is private. If you are not the marketplace administrator, return to the shop.</p>
      </section>
    </main>
  );
}
