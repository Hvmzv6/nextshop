import { NextResponse } from "next/server";

import { authenticateUser } from "../../../../src/lib/auth";
import { loginSchema } from "../../../../src/lib/validations/auth";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const result = loginSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 422 },
    );
  }

  const redirectTo = await authenticateUser(result.data);

  if (!redirectTo) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  return NextResponse.json({ redirectTo });
}
