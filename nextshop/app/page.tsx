import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          NextShop
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-zinc-300 hover:text-white">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-white px-4 py-2 font-medium text-zinc-950 hover:bg-zinc-200"
          >
            Create account
          </Link>
        </nav>
      </header>
      <section className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-20">
        <div className="max-w-2xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Thoughtfully selected essentials
          </p>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">
            Shop better. Live better.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
            Discover useful products for your everyday life, from workspaces
            and home comforts to outdoor adventures.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/products"
              className="rounded-full bg-emerald-400 px-6 py-3 font-semibold text-zinc-950 hover:bg-emerald-300"
            >
              Browse products
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-zinc-700 px-6 py-3 font-semibold hover:border-zinc-500"
            >
              Join NextShop
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
