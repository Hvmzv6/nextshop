import bcrypt from "bcryptjs";
import { Prisma } from "../../app/generated/prisma/client";

import { prisma } from "./prisma";
import { encryptSession, setSessionCookie, type Role } from "./session";

export function dashboardForRole(role: Role) {
  if (role === "ADMIN") {
    return "/admin";
  }

  if (role === "MODERATOR") {
    return "/moderator";
  }

  return "/account";
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const passwordHash = await bcrypt.hash(input.password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: "CLIENT",
      },
      select: {
        id: true,
        role: true,
      },
    });

    const token = await encryptSession({
      userId: user.id,
      role: user.role as Role,
    });
    await setSessionCookie(token);

    return dashboardForRole(user.role as Role);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return null;
    }

    throw error;
  }
}

export async function authenticateUser(input: {
  email: string;
  password: string;
}) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      role: true,
      passwordHash: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive || !["CLIENT", "MODERATOR", "ADMIN"].includes(user.role)) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    return null;
  }

  const role = user.role as Role;
  const token = await encryptSession({ userId: user.id, role });
  await setSessionCookie(token);

  return dashboardForRole(role);
}
