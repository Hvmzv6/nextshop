import "server-only";

import { cookies } from "next/headers";
import { jwtVerify, SignJWT, type JWTPayload } from "jose";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

export const ROLES = ["CLIENT", "MODERATOR", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export type SessionPayload = JWTPayload & {
  sub: string;
  role: Role;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }

  return new TextEncoder().encode(secret);
}

function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLES.includes(value as Role);
}

export async function encryptSession(payload: {
  userId: string;
  role: Role;
}) {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSessionSecret());
}

export async function decryptSession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
    });

    if (typeof payload.sub !== "string" || !isRole(payload.role)) {
      return null;
    }

    return {
      ...payload,
      sub: payload.sub,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function getSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export {
  encryptSession as encrypt,
  decryptSession as decrypt,
};
