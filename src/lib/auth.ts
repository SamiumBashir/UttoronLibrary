import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { cookies } from "next/headers";
import { readStore } from "@/lib/db";
import type { PublicUser, UserRecord } from "@/lib/types";

export const SESSION_COOKIE_NAME = "uttoron_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

let cachedRuntimeSecret: string | null = null;

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  if (cachedRuntimeSecret) return cachedRuntimeSecret;

  const candidatePaths = [
    path.join(process.cwd(), "data", ".session-secret"),
    path.join(os.tmpdir(), "uttoron_prokasoni_data", ".session-secret"),
  ];

  for (const secretPath of candidatePaths) {
    try {
      const dir = path.dirname(secretPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(secretPath)) {
        const existing = fs.readFileSync(secretPath, "utf8").trim();
        if (existing.length >= 32) {
          cachedRuntimeSecret = existing;
          return existing;
        }
      }
      const generated = crypto.randomBytes(32).toString("hex");
      fs.writeFileSync(secretPath, generated, { encoding: "utf8", mode: 0o600 });
      cachedRuntimeSecret = generated;
      return generated;
    } catch {
      continue;
    }
  }

  cachedRuntimeSecret = crypto.randomBytes(32).toString("hex");
  return cachedRuntimeSecret;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, "hex");
  const derived = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derived.length) return false;
  return crypto.timingSafeEqual(keyBuf, derived);
}

interface SessionPayload {
  userId: string;
  role: "customer" | "admin";
  exp: number;
}

export function signSessionToken(user: Pick<UserRecord, "id" | "role">): string {
  const payload: SessionPayload = {
    userId: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as SessionPayload;
    if (!parsed.userId || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function toPublicUser(user: UserRecord): PublicUser {
  const { passwordHash: _p, resetTokenHash: _r, resetTokenExpiresAt: _e, ...rest } = user;
  return rest;
}

export async function getAuthenticatedUser(): Promise<UserRecord | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifySessionToken(token);
  if (!payload) return null;
  const store = readStore();
  return store.users.find((u) => u.id === payload.userId) ?? null;
}

export async function setSessionCookie(user: UserRecord): Promise<void> {
  const cookieStore = await cookies();
  const token = signSessionToken(user);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

