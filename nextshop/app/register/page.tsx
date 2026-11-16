import Link from "next/link";

import { AuthForm } from "../../src/components/forms/AuthForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="flex w-full max-w-md flex-col gap-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">NextShop</p>
          <h1 className="mt-2 text-3xl font-semibold">Create your account</h1>
          <p className="mt-2 text-zinc-600">Start shopping with NextShop.</p>
        </div>
        <AuthForm mode="register" />
        <p className="text-sm text-zinc-600">
          Already have an account?{" "}
          <Link className="font-medium text-zinc-950 underline" href="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
