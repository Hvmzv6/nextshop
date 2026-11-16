import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="flex max-w-lg flex-col gap-5 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Error 403
        </p>
        <h1 className="text-3xl font-semibold">Access denied</h1>
        <p className="text-zinc-600">
          You do not have permission to view this page.
        </p>
        <Link
          className="mx-auto rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white"
          href="/"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}
