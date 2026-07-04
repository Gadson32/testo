# Sentinel Field

Multi-tenant SaaS platform for pest control business operations.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in your keys
cp .env.example .env.local

# 3. Push database schema
npm run db:push

# 4. Start development server
npm run dev
```

## Setup Checklist

1. **Supabase** - Create project at supabase.com, copy database URL
2. **Clerk** - Create app at clerk.com, copy publishable + secret keys
3. **Stripe** - Create account at stripe.com, set up products/prices, copy keys
4. **Resend** - Sign up at resend.com, verify domain, copy API key
5. **Twilio** - Sign up at twilio.com, get phone number, copy credentials
6. **Vercel** - Connect repo for deployment

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | Clerk |
| Payments | Stripe |
| Email | Resend |
| SMS | Twilio |
| Testing | Playwright |
| Hosting | Vercel |
