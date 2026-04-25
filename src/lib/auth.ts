import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET = process.env.ADMIN_SECRET;
export const COOKIE_NAME = "admin_session";

function getSecret(): string {
  if (!SECRET) throw new Error("ADMIN_SECRET not set in .env.local");
  return SECRET;
}

export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD not set in .env.local");
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function issueToken(): string {
  const payload = `admin.${Date.now()}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [prefix, ts, sig] = parts;
  if (prefix !== "admin") return false;
  const expected = createHmac("sha256", getSecret())
    .update(`${prefix}.${ts}`)
    .digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;
  // 7-day expiry
  const issued = Number(ts);
  if (!Number.isFinite(issued)) return false;
  return Date.now() - issued < 7 * 24 * 60 * 60 * 1000;
}
