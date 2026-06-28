# Sentinel Field

Multi-tenant SaaS for pest control operations management.

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL via Supabase + Prisma ORM
- **Auth:** Clerk (multi-tenant, role-based)
- **Payments:** Stripe (subscriptions + invoicing)
- **Email:** Resend
- **SMS:** Twilio
- **Testing:** Playwright (e2e), ESLint
- **Deploy:** Vercel

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build (runs prisma generate first)
- `npm run lint` — ESLint
- `npm run format` — Prettier
- `npm run db:push` — push schema to database
- `npm run db:migrate` — run migrations
- `npm run db:studio` — open Prisma Studio
- `npm run test:e2e` — run Playwright tests

## Architecture

- `src/app/(marketing)/` — public landing page
- `src/app/(auth)/` — Clerk sign-in/sign-up
- `src/app/(dashboard)/` — authenticated app (sidebar layout)
- `src/app/api/webhooks/` — Stripe + Clerk webhook handlers
- `src/server/actions/` — server actions (customers, jobs, invoices)
- `src/lib/` — shared utilities (db, auth, stripe, email, sms, validations)
- `src/components/` — UI components, forms, layout
- `prisma/schema.prisma` — database schema
- `e2e/` — Playwright tests

## Multi-Tenancy

Every data query MUST filter by `tenantId`. The `requireUser()` helper returns the current user with their tenant. Use `withTenantScope()` for scoped queries.
