# CLAUDE.md

Project guidance for working in this repo.

## What this is
Mobile-first logistics web app for an annual men's fishing trip (50–100 attendees),
Broken Bow, Sep 25–27 2026. Next.js 14 (App Router, TS) + Tailwind + Supabase,
deployed on Vercel at mensfishingtrip.com.

## Architecture rules
- **All app data access is server-side** via the Supabase `service_role` key
  (`src/lib/supabase/admin.ts`). Never import that client into a client component,
  and never expose the service-role key to the browser.
- The anon/SSR client (`src/lib/supabase/server.ts`) is used **only** for admin
  auth sessions, not for reading app data.
- Tables have RLS enabled with **no public policies** on purpose — direct anon
  access is meant to fail; the server is the only door in.
- Every admin server action must call `requireAdmin()` (`src/lib/require-admin.ts`)
  before mutating data.

## Access model
- **Attendees**: no login. Open RSVP form; they edit via name + phone lookup
  (`findAttendee` in `src/app/rsvp/actions.ts`).
- **Admins**: Supabase email/password, gated by membership in the `admins` table.
  Allowed signup emails come from the `ADMIN_ALLOWLIST` env var.

## Where things live
- Trip constants / copy (dates, $90, Venmo `@yomikeywhitey`): `src/lib/config.ts`
- DB schema + seed: `supabase/schema.sql`
- Types: `src/lib/types.ts`
- Server reads (graceful when unconfigured): `src/lib/data.ts`
- Admin pages: `src/app/admin/*`; admin client components: `src/components/admin/*`

## Conventions
- Forms use `useFormState` / `useFormStatus` (React 18 / `react-dom`).
- Admin mutations use `useTransition` + `router.refresh()` to re-fetch.
- Validation via `zod` in server actions.
- The app must still build and render with **no env vars set** (`data.ts` and
  `getAdminUser` degrade to empty/logged-out). Keep it that way.

## Commands
- `npm run dev` – local dev
- `npm run build` – production build (run before pushing)
- `npx tsc --noEmit` – type check
