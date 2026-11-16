# NextShop: Product Requirements Document

*v1.0 · Next.js 16 (App Router) · TypeScript · Prisma 6 · SQLite*

## 1. Overview

NextShop is an online shop. Guests browse products, clients buy them, moderators curate content and reviews, and admins run the platform. It is also a learning build: clean architecture, reusable components, secure authentication and role-based access control (RBAC).

**Goals**

- Secure sign-up and sign-in (bcrypt hashing, JWT in an httpOnly cookie)
- Four roles, each with its own experience and dashboard
- A reusable component library with no duplicated UI
- Server-side validation (Zod) and server-side authorization everywhere

**Non-goals (v1):** real payments, multi-vendor, email verification, password reset, i18n.

## 2. Roles and permissions

| Capability | Guest | Client | Moderator | Admin |
| --- | --- | --- | --- | --- |
| Browse products and categories | ✅ | ✅ | ✅ | ✅ |
| Sign up / sign in | ✅ | n/a | n/a | n/a |
| Cart and checkout | ❌ | ✅ | ❌ | ❌ |
| View own orders | ❌ | ✅ | ❌ | ❌ |
| Write a review | ❌ | ✅ | ❌ | ❌ |
| Approve / hide reviews | ❌ | ❌ | ✅ | ✅ |
| Create / edit products and categories | ❌ | ❌ | ✅ | ✅ |
| Delete products | ❌ | ❌ | ❌ | ✅ |
| View all orders, update order status | ❌ | ❌ | read only | ✅ |
| Manage users and change roles | ❌ | ❌ | ❌ | ✅ |
| Platform stats | ❌ | ❌ | ❌ | ✅ |

**Guest** is not a database role: it means no valid session.

## 3. Dashboards

- **Guest:** public storefront, product detail, login/register CTAs.
- **Client** (`/account`): profile, order history, cart, my reviews.
- **Moderator** (`/moderator`): review queue (approve/hide), product and category editor, orders (read only).
- **Admin** (`/admin`): KPIs (users, orders, revenue), user table with role switch, full product/order management.

## 4. User stories (MVP)

1. As a guest, I can register with name, email and password.
2. As a user, I can sign in and am redirected to the dashboard of my role.
3. As a client, I can add products to a cart, change quantities and place an order.
4. As a client, I can review a product I purchased.
5. As a moderator, I can approve or hide reviews and edit products.
6. As an admin, I can promote or demote users and see all orders.
7. As anyone, opening a page above my role gives a redirect (not logged in) or a 403 page (wrong role).

## 5. Tech stack

| Component | Technology | Role |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript | Front and API in one project |
| ORM | Prisma 6 | Typed data access, migrations |
| Database | SQLite (`dev.db`) | Dev storage (Postgres later) |
| Hashing | bcryptjs | Password protection |
| Session | jose (JWT HS256) + httpOnly cookie | Stateless login |
| Validation | Zod | Server-side input control |
| UI | Tailwind CSS (+ optional shadcn/ui) | Styling, base components |
| Forms | `useActionState` + Server Actions | Auth and CRUD forms |

## 6. Next.js 16 points to respect

- `middleware.ts` is now **`proxy.ts`** (export a function named `proxy`). Verify details in the official Next.js 16 upgrade guide.
- `cookies()`, `headers()`, `params` and `searchParams` are **async**: always `await` them.
- Turbopack is the default bundler. Node.js 20.9+ required.
- Defense in depth: `proxy.ts` does only a fast optimistic check (cookie present and JWT valid). The **real** check happens again in a server-side Data Access Layer (`lib/dal.ts`) before every read or write.

## 7. Folder structure

```
nextshop/
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ src/
│  ├─ proxy.ts                  # optimistic route guard
│  ├─ app/
│  │  ├─ (public)/              # layout with navbar + footer
│  │  │  ├─ page.tsx            # home
│  │  │  ├─ products/page.tsx
│  │  │  └─ products/[slug]/page.tsx
│  │  ├─ (auth)/login/page.tsx
│  │  ├─ (auth)/register/page.tsx
│  │  ├─ account/               # CLIENT
│  │  ├─ moderator/             # MODERATOR, ADMIN
│  │  ├─ admin/                 # ADMIN
│  │  ├─ forbidden/page.tsx
│  │  └─ api/auth/{register,login,logout}/route.ts
│  ├─ components/
│  │  ├─ ui/                    # Button, Input, Card, Badge, Modal, Table
│  │  ├─ forms/                 # FormField, AuthForm, ProductForm
│  │  ├─ layout/                # Navbar, Sidebar, DashboardShell
│  │  └─ shop/                  # ProductCard, ProductGrid, CartItem
│  ├─ lib/
│  │  ├─ prisma.ts              # single client instance
│  │  ├─ session.ts             # encrypt/decrypt JWT, cookie helpers
│  │  ├─ dal.ts                 # getSession, requireUser, requireRole
│  │  ├─ permissions.ts         # role to routes/abilities map
│  │  └─ validations/           # auth.ts, product.ts, order.ts (Zod)
│  ├─ actions/                  # server actions (cart, product, review...)
│  └─ types/
├─ .env                         # DATABASE_URL, SESSION_SECRET (never committed)
└─ .gitignore
```

## 8. Authentication and authorization flow

1. **Register:** `POST /api/auth/register` → Zod validate → check email unique → `bcrypt.hash` → create User (`CLIENT`) → sign JWT → set cookie.
2. **Login:** `POST /api/auth/login` → find user → `bcrypt.compare` → sign JWT → set cookie → redirect by role.
3. **JWT payload:** `{ sub: userId, role, exp }`, HS256, 7 days. Cookie: `httpOnly`, `secure` (prod), `sameSite=lax`, `path=/`.
4. **proxy.ts:** guards `/account`, `/moderator`, `/admin`. No valid cookie → redirect `/login?next=...`. Wrong role → redirect `/forbidden`.
5. **DAL:** `requireRole(["ADMIN"])` called at the top of each protected page, server action and route handler.
6. **Logout:** `POST /api/auth/logout` deletes the cookie.

**Redirect after login:** ADMIN → `/admin`, MODERATOR → `/moderator`, CLIENT → `/account`.

**Rule:** the role comes from the database (or a re-verified token), never from the request body. Registration can never set a role.

## 9. Prisma schema

SQLite does not store decimals, so prices are integers in cents. Roles and statuses are strings validated by Zod (you can switch to native enums when moving to PostgreSQL).

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// Role: "CLIENT" | "MODERATOR" | "ADMIN"
model User {
  id           String    @id @default(cuid())
  name         String
  email        String    @unique
  passwordHash String
  role         String    @default("CLIENT")
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  cart         Cart?
  orders       Order[]
  reviews      Review[]

  @@index([role])
}

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  slug        String    @unique
  description String?
  products    Product[]
}

model Product {
  id          String      @id @default(cuid())
  name        String
  slug        String      @unique
  description String
  priceCents  Int
  stock       Int         @default(0)
  imageUrl    String?
  isPublished Boolean     @default(true)
  categoryId  String
  category    Category    @relation(fields: [categoryId], references: [id])
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  cartItems   CartItem[]
  orderItems  OrderItem[]
  reviews     Review[]

  @@index([categoryId])
}

model Cart {
  id     String     @id @default(cuid())
  userId String     @unique
  user   User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items  CartItem[]
}

model CartItem {
  id        String  @id @default(cuid())
  cartId    String
  productId String
  quantity  Int     @default(1)
  cart      Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])

  @@unique([cartId, productId])
}

// Status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED"
model Order {
  id         String      @id @default(cuid())
  userId     String
  user       User        @relation(fields: [userId], references: [id])
  status     String      @default("PENDING")
  totalCents Int
  address    String
  createdAt  DateTime    @default(now())
  items      OrderItem[]

  @@index([userId])
  @@index([status])
}

model OrderItem {
  id             String  @id @default(cuid())
  orderId        String
  productId      String
  quantity       Int
  unitPriceCents Int     // price snapshot at purchase time
  order          Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product        Product @relation(fields: [productId], references: [id])
}

// Status: "PENDING" | "APPROVED" | "HIDDEN"
model Review {
  id        String   @id @default(cuid())
  rating    Int      // 1..5
  comment   String
  status    String   @default("PENDING")
  userId    String
  productId String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, productId])
  @@index([status])
}
```

**Seed (`prisma/seed.ts`):** one admin, one moderator, one client (passwords hashed), 3 categories, \~12 products.

## 10. Validation (Zod)

- **Register:** name 2–60 chars, valid email (lowercased), password ≥ 8 chars with a letter and a digit, confirm password matches.
- **Login:** email and password required.
- **Product:** name, slug, description, `priceCents` positive int, `stock` ≥ 0 int, `categoryId` exists.
- **Review:** rating 1–5 int, comment 10–500 chars.
- **Order:** address required; quantities positive ints. Prices are **always read from the DB**, never from the client.
- Auth errors are generic ("Invalid email or password") to avoid user enumeration.

## 11. Routes and access

| Route | Access |
| --- | --- |
| `/`, `/products`, `/products/[slug]` | Public |
| `/login`, `/register` | Guests only (logged-in users are redirected to their dashboard) |
| `/account/**`, `/cart`, `/checkout` | CLIENT |
| `/moderator/**` | MODERATOR, ADMIN |
| `/admin/**` | ADMIN |
| `/forbidden` | Any |

## 12. API and server actions

| Endpoint / action | Method | Role |
| --- | --- | --- |
| `/api/auth/register` | POST | Guest |
| `/api/auth/login` | POST | Guest |
| `/api/auth/logout` | POST | Any logged-in user |
| `addToCart`, `updateCartItem`, `removeCartItem` | Action | CLIENT |
| `placeOrder` | Action | CLIENT |
| `createReview` | Action | CLIENT (must have purchased) |
| `moderateReview` | Action | MODERATOR, ADMIN |
| `createProduct`, `updateProduct` | Action | MODERATOR, ADMIN |
| `deleteProduct` | Action | ADMIN |
| `updateOrderStatus` | Action | ADMIN |
| `changeUserRole`, `toggleUserActive` | Action | ADMIN |

HTTP codes: 200/201 success, 400 or 422 validation, 401 not authenticated, 403 wrong role, 404 not found, 409 email already used.

## 13. Reusable components

- **ui/**: `Button` (variants, loading state), `Input`, `Select`, `Textarea`, `Card`, `Badge` (role/status colors), `Modal`, `DataTable`, `EmptyState`, `Spinner`.
- **forms/**: `FormField` (label + input + error), `AuthForm` (shared by login and register via a config prop), `ProductForm` (shared by create and edit), `SubmitButton` (uses `useFormStatus`).
- **layout/**: `Navbar` (adapts to session), `DashboardShell` + `Sidebar` (one shell, nav items injected per role from `permissions.ts`), `Footer`.
- **shop/**: `ProductCard`, `ProductGrid`, `PriceTag`, `RatingStars`, `QuantityInput`, `CartSummary`.
- **auth/**: `RoleGate` (server component that renders children only for allowed roles).

Conventions: Server Components by default; `"use client"` only for interactive leaves; one component per file; props typed with TypeScript interfaces.

## 14. Security checklist

- Passwords hashed with bcrypt (cost 10–12), never logged or returned.
- `SESSION_SECRET` ≥ 32 random chars in `.env`; `.env` and `dev.db` in `.gitignore`.
- Cookie flags: `httpOnly`, `secure`, `sameSite=lax`.
- Authorization re-checked server-side in every action and route (never trust `proxy.ts` alone).
- Never return `passwordHash`: use Prisma `select`.
- Deactivated users (`isActive=false`) are rejected at login and in the DAL.
- Rate-limit login (stretch goal).
- A single Prisma client instance (global singleton in dev).

## 15. Roadmap

| Phase | Content | Done when |
| --- | --- | --- |
| 0 | Init project, `.env`, `.gitignore`, Tailwind, folder structure | App runs |
| 1 | Prisma schema, migration, seed, Prisma Studio check | Seed users visible |
| 2 | Zod schemas, `session.ts`, `dal.ts` | Unit-checked helpers |
| 3 | Auth API + login/register UI | Register, login, logout work |
| 4 | `proxy.ts` + role redirects + `/forbidden` | Each role lands on the right place |
| 5 | Storefront: home, listing, detail, categories | Guest can browse |
| 6 | Cart, checkout, orders (client dashboard) | Client can order |
| 7 | Moderator dashboard: reviews, products | Moderation works |
| 8 | Admin dashboard: users, roles, orders, stats | Role switch works |
| 9 | Tests (curl or Playwright), README, demo | Acceptance criteria pass |

## 16. Acceptance criteria

- A guest opening `/admin` is redirected to `/login`; a client opening `/admin` lands on `/forbidden`.
- Registering with an existing email returns 409 and a clear message.
- The database never contains a plain-text password (check in Prisma Studio).
- A client cannot call `moderateReview` or `changeUserRole` even by crafting the request.
- Totals are computed on the server from DB prices.
- Login, register and product forms reuse shared components (no copy-pasted forms).

## 17. Setup commands

```bash
npx create-next-app@latest nextshop --typescript --tailwind --eslint --app --src-dir
cd nextshop
npm i prisma@6 @prisma/client@6 bcryptjs jose zod
npm i -D @types/bcryptjs tsx
npx prisma init --datasource-provider sqlite
# paste the schema, set DATABASE_URL="file:./dev.db" and SESSION_SECRET in .env
npx prisma migrate dev --name init
npx prisma db seed
npx prisma studio
```

**Next step:** start with Phase 1, then ask me for `session.ts`, `dal.ts`, the Zod schemas and `proxy.ts` one by one.
