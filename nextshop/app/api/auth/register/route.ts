import { NextResponse } from "next/server";

import { registerUser } from "../../../../src/lib/auth";
import { registerSchema } from "../../../../src/lib/validations/auth";

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

  const result = registerSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Please correct the highlighted fields.", issues: result.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const redirectTo = await registerUser(result.data);

  if (!redirectTo) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }

  return NextResponse.json({ redirectTo }, { status: 201 });
}
