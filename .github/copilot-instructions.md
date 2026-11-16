# NextShop: project rules
- Stack: Next.js 16 (App Router), TypeScript strict, Prisma 6 + SQLite, Tailwind, Zod, bcryptjs, jose.
- The full spec is in docs/PRD.md. Follow it, and do not invent features outside it.
- Next.js 16: use proxy.ts (not middleware.ts), and await cookies(), params and searchParams.
- Server Components by default; add "use client" only for interactive leaves.
- Reusable components live in src/components/{ui,forms,layout,shop}. Never duplicate UI.
- Validate every input with Zod on the server. Never trust the role sent by the client.
- Re-check authorization in every server action and route via lib/dal.ts (requireRole).
- Never return passwordHash. Prices are integers in cents and are always read from the DB.
- Small, typed files, one component per file. No `any`.