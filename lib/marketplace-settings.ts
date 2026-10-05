import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export type MarketplaceSettings = {
  whatsappPhone: string;
};

const SETTINGS_DIRECTORY = path.join(process.cwd(), ".elymart-data");
const SETTINGS_FILE = path.join(SETTINGS_DIRECTORY, "marketplace-settings.json");
const EMPTY_SETTINGS: MarketplaceSettings = { whatsappPhone: "" };

export function normalizeWhatsAppPhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!/^\+?[\d\s().-]+$/.test(trimmed)) return null;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

export async function readMarketplaceSettings(): Promise<MarketplaceSettings> {
  try {
    const raw = await readFile(SETTINGS_FILE, "utf8");
    const parsed = JSON.parse(raw) as { whatsappPhone?: unknown };
    if (typeof parsed.whatsappPhone !== "string") return EMPTY_SETTINGS;
    const normalized = normalizeWhatsAppPhone(parsed.whatsappPhone);
    return { whatsappPhone: normalized ?? "" };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      return EMPTY_SETTINGS;
    }
    throw error;
  }
}

export async function writeMarketplaceSettings(settings: MarketplaceSettings) {
  await mkdir(SETTINGS_DIRECTORY, { recursive: true });
  const temporaryFile = path.join(SETTINGS_DIRECTORY, `marketplace-settings.${randomUUID()}.tmp`);
  try {
    await writeFile(temporaryFile, `${JSON.stringify(settings, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await rename(temporaryFile, SETTINGS_FILE);
  } catch (error) {
    await unlink(temporaryFile).catch(() => undefined);
    throw error;
  }
}
