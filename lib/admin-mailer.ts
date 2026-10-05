import "server-only";

import nodemailer from "nodemailer";

export type AdminMailSettings = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
};

export function getAdminMailSettings(): AdminMailSettings | null {
  const host = process.env.SMTP_HOST?.trim() ?? "";
  const port = Number(process.env.SMTP_PORT ?? 0);
  const user = process.env.SMTP_USER?.trim() ?? "";
  const password = process.env.SMTP_PASSWORD ?? "";
  const from = process.env.SMTP_FROM?.trim() ?? "";
  const secureSetting = process.env.SMTP_SECURE?.trim().toLowerCase();

  if (
    !host ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !user ||
    !password ||
    !from ||
    (secureSetting && secureSetting !== "true" && secureSetting !== "false")
  ) {
    return null;
  }

  return { host, port, secure: secureSetting ? secureSetting === "true" : port === 465, user, password, from };
}

export function isAdminEmailDeliveryConfigured() {
  return getAdminMailSettings() !== null;
}

export async function sendAdminVerificationCode(to: string, code: string) {
  const settings = getAdminMailSettings();
  if (!settings) throw new Error("Email verification is not configured.");

  const transporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: { user: settings.user, pass: settings.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    disableFileAccess: true,
    disableUrlAccess: true,
    tls: { minVersion: "TLSv1.2" },
  });

  try {
    await transporter.sendMail({
      from: settings.from,
      to,
      subject: "Your ElyMart admin verification code",
      text: [
        `Your ElyMart admin verification code is: ${code}`,
        "",
        "This code expires in 10 minutes and can only be used once.",
        "If you did not request this code, you can ignore this email.",
      ].join("\n"),
    });
  } finally {
    transporter.close();
  }
}
