import Link from "next/link";

import { AuthForm } from "../../src/components/forms/AuthForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="flex w-full max-w-md flex-col gap-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">NextShop</p>
          <h1 className="mt-2 text-3xl font-semibold">Sign in</h1>
          <p className="mt-2 text-zinc-600">Welcome back to NextShop.</p>
        </div>
        <AuthForm mode="login" />
        <p className="text-sm text-zinc-600">
          Need an account?{" "}
          <Link className="font-medium text-zinc-950 underline" href="/register">
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
}
