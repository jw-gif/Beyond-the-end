# The Family Cabin — Front-End Prototype

A private multi-generational cabin booking and coordination platform. Built with React 19 + TanStack Start, Tailwind CSS v4, and an in-memory data layer that mirrors a Supabase schema.

---

## Running the prototype

### Mode 1 — Zero-config (in-memory, no backend needed)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). All data comes from the seeded in-memory store (`src/lib/data/store.ts`). Changes persist in-memory for the session only.

Use the **"View as:"** dropdown in the header to switch between Family, Friends, and Public tier views without signing in.

### Mode 2 — Supabase-backed

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env.local` and fill in your project URL and anon key:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Run migrations:
   ```bash
   # Using Supabase CLI:
   supabase link --project-ref your-project-ref
   supabase db push

   # Or apply manually:
   psql $DATABASE_URL < supabase/migrations/001_schema.sql
   psql $DATABASE_URL < supabase/migrations/002_seed.sql
   ```
4. Create demo users in the Supabase dashboard (Authentication → Users), then insert matching rows in the `profiles` table with the desired tier (`family`, `friends`, or `public`).
5. Start the dev server:
   ```bash
   npm run dev
   ```

When `VITE_SUPABASE_URL` is present, wire up the `src/lib/data/store.ts` functions to call Supabase instead of the in-memory arrays (the function signatures are identical — just swap the implementation).

---

## Available routes

| Route | Screen |
|-------|--------|
| `/` | Calendar home — month grid, hero image, availability legend, Upcoming Stays toggle |
| `/bookings` | My Bookings — profile sidebar, upcoming stays with status chips, past memoirs |
| `/bookings/new` | Reserve Your Time — date picker, guest count, tier-based pricing, cabin etiquette sidebar |
| `/coop` | Co-op hub — Claim-an-Item checklist, Guest Notes guestbook, Standing Inventory |
| `/admin` | Admin dashboard — stay activity, rate management, calendar blocking, user management, KPI cards |

---

## Tier permissions

Use the **"View as:"** selector in the top-right of the header to preview each tier:

| Tier | Calendar | Booking details | Booking cost |
|------|----------|-----------------|------|
| **Family** | All details (names, notes) | Full access | $0.00 |
| **Friends** | Dates marked "Reserved", no names | Own bookings only | $0.00 |
| **Public** | Availability only | Own bookings only | Market rate ($250/night) — payment UI stubbed |

The Admin dashboard (`/admin`) is only accessible to Family tier users.

---

## Stack

- **React 19** + **TanStack Start** (file-based routing via `src/routes/`)
- **Tailwind CSS v4** with `@theme` tokens mapped 1:1 from `DESIGN.md`
- **Google Fonts**: Literata (headings, `font-literata`) + Manrope (body, `font-manrope`)
- **In-memory data store** at `src/lib/data/store.ts` — all mutations go through this layer
- **Supabase** migration files at `supabase/migrations/` include schema, RLS policies, and seed data

---

## Build

```bash
npm run build    # production build (client + SSR)
npm run preview  # preview the production build locally
npm run test     # vitest
```
