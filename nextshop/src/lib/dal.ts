import "server-only";

import { redirect } from "next/navigation";

import {
  decryptSession,
  getSessionCookie,
  type Role,
} from "./session";
import { prisma } from "./prisma";

const ROLES = ["CLIENT", "MODERATOR", "ADMIN"] as const;

function isRole(value: string): value is Role {
  return ROLES.includes(value as Role);
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function getSession(): Promise<AuthenticatedUser | null> {
  const token = await getSessionCookie();

  if (!token) {
    return null;
  }

  const session = await decryptSession(token);

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: userSelect,
  });

  if (!user || !user.isActive || !isRole(user.role)) {
    return null;
  }

  return {
    ...user,
    role: user.role,
  };
}

export async function requireUser() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(allowedRoles: readonly Role[]) {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role)) {
    redirect("/forbidden");
  }

  return user;
}
