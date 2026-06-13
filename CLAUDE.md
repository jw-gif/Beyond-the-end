# Project Context: The Family Cabin

## What this is

A private, multi-generational cabin booking and coordination platform — prototype stage. All five screens are complete and navigable with realistic seeded data. No production hardening required.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + TanStack Start (file-based routing) |
| Styling | Tailwind CSS v4 with `@theme` tokens |
| Fonts | Literata (serif headings) + Manrope (sans body) via Google Fonts |
| Data | In-memory store (`src/lib/data/store.ts`) with Supabase-ready schema |
| Auth | Tier context (`src/lib/context/TierContext.tsx`) with dev switcher |
| DB schema | `supabase/migrations/001_schema.sql` + RLS policies |
| Seed data | `src/lib/data/seed.ts` (in-memory) + `supabase/migrations/002_seed.sql` |

## File structure

```
src/
  lib/
    types.ts                  — TypeScript types (Profile, Booking, CoopItem, etc.)
    data/
      seed.ts                 — Seed data (Julian Thorne, Millers, bookings, etc.)
      store.ts                — Mutable in-memory store + CRUD helpers
    context/
      TierContext.tsx         — viewerTier state + currentUser (demo sessions per tier)
  components/
    ui/
      Button.tsx              — Primary/secondary/ghost/danger variants
      Card.tsx                — 1px border, soft shadow, 24px padding
      Chip.tsx                — Status badges + tier chips
      Input.tsx               — Input + TextArea with label/error
    layout/
      Header.tsx              — Nav + dev-only tier switcher dropdown
      Footer.tsx              — Footer links
  routes/
    __root.tsx                — Root layout (TierProvider wraps everything)
    index.tsx                 — / Calendar home
    bookings.tsx              — /bookings My Bookings dashboard
    bookings.new.tsx          — /bookings/new Booking flow
    coop.tsx                  — /coop Co-op hub
    admin.tsx                 — /admin Admin dashboard (family-only)
  styles.css                  — Tailwind @theme tokens from DESIGN.md
supabase/
  migrations/
    001_schema.sql            — Tables + RLS policies
    002_seed.sql              — Seed inventory, rates, notes, blocks
```

## Data model

| Table | Key fields |
|-------|-----------|
| `profiles` | id, name, email, **tier** (family/friends/public), emergency_contact_* |
| `bookings` | profile_id, start_date, end_date, guest_adults, guest_children, host_note, **status**, tier_at_booking, title |
| `coop_items` | label, subtitle, **claimed_by** (nullable profile_id) |
| `guest_notes` | author_name, title, body, note_date |
| `inventory` | label, detail, icon (read-only) |
| `memoirs` | profile_id, title, body, memoir_date, photo_count |
| `admin_blocks` | start_date, end_date, reason |
| `rates` | tier, nightly_rate |

## Three-tier permission rules

These rules are enforced in `store.ts` (in-memory mode) and as Supabase RLS policies:

- **Family**: sees all booking details (who, dates, notes), books for $0
- **Friends**: sees dates are taken but NOT who or any details; books for $0
- **Public**: sees only availability + own reservations; would pay market rate (Stripe seam stubbed in `/bookings/new`)
- **Admin dashboard** (`/admin`): family-only; enforced by component guard

## Design tokens

Tailwind CSS v4 `@theme` variables in `src/styles.css` map 1:1 to `DESIGN.md`:
- Colors: `--color-primary` (#243624), `--color-secondary` (#526347), etc.
- Spacing: `--spacing-xxl` (64px), `--spacing-xl` (40px), `--spacing-lg` (24px), etc.
- Radius: `--radius-DEFAULT` (0.5rem / 8px)
- Fonts: `--font-literata`, `--font-manrope`

Usage in components: `text-primary`, `bg-secondary-container`, `font-literata`, `font-manrope`.

## Seeded demo data

- **Julian Thorne** — Family tier, current user when "View as: Family"
- **David Miller** — Friends tier, current user when "View as: Friends"
- **Local Guide Sarah** — Public tier
- **Aunt Clara**, **Uncle Jack**, **Marcus Vane** — supporting cast
- **Bookings**: "Winter Solstice Retreat" (Oct 18–31, confirmed), "Spring Thaw Weekend" (Mar 1–6, pending), "Fall Getaway" (Marcus, friends)
- **Co-op items**: Food Provisions Bundle (claimed by Aunt Clara), Propane Tank (claimed by Julian), two unclaimed
- **Guest Notes**: "Propane is Low" (Margaret S.), "Bear Activity Near Trail" (The Miller Family)
- **Inventory**: 8 standing staples
- **Memoirs**: "Summer Lake Dip", "Autumn Solitude"
- **Admin block**: Nov 20–30 "Winterization Maintenance"
- **Rates**: Public $250/night, Friends $150/night

## Connecting Supabase

1. `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env.local`
2. Run `supabase/migrations/001_schema.sql` then `002_seed.sql`
3. In `src/lib/data/store.ts`, swap the in-memory array operations for `supabase.from(...).select()` etc. The function signatures don't change — only the implementation body.

## Known seams for future work

- **Stripe**: `/bookings/new` renders a dashed `[Stripe Payment Element]` placeholder for Public tier. Wire up `@stripe/stripe-js` there.
- **Email invitations**: Admin "Invite New Member" button is a stub.
- **Photo uploads**: Memoir `photo_count` is seeded; actual upload flow needs Supabase Storage.
- **Magic-link auth**: Auth flow uses the dev tier switcher; replace with `supabase.auth.signInWithOtp()` for production.
