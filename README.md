# Men's Fishing Trip 🎣

A mobile-friendly web app to manage logistics for the annual men's fishing trip in
Broken Bow (Fri Sep 25 – Sun Sep 27, 2026). Handles RSVPs, the weekend agenda,
cabin and fishing-group assignments, breakfast/coffee signups, important locations,
and an organizer-only dashboard for payment and ride tracking.

Built with **Next.js 14**, **Tailwind CSS**, and **Supabase** (Postgres + Auth).
Deploys to **Vercel**.

---

## What's in here

**Public (no login):**
- **Home** – trip overview + Venmo payment.
- **RSVP** – name, phone, emergency contact, ride preference, departure time, and
  whether they'll drive (and how many seats). Edit later by looking up name + phone.
- **Agenda** – Friday–Sunday schedule (speakers, fishing sessions, dinners, Sunday
  7:30 AM river sermon).
- **Signups** – volunteer to cook breakfast or make coffee (Saturday/Sunday).
- **Locations** – cabins, dinner spots, the river, with directions links.

**Organizer dashboard (`/admin`, login required):**
- **Overview** – RSVP/paid/seat counts and a cabin-host check.
- **Roster** – toggle payment, add a payment note, assign cabin/host/session/group,
  search & filter, and export a CSV.
- **Cabins** – occupancy per cabin and one-tap host assignment. Warns about any
  occupied cabin with no host.
- **Fishing** – Saturday morning/afternoon groups, each with a guide.
- **Rides** – who rides with whom, plus departure/arrival times both directions.
  Organizer-only.

---

## One-time setup

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com) → **New project**. Pick a password and region.

### 2. Create the database
In Supabase: **SQL Editor → New query**, paste the contents of
[`supabase/schema.sql`](supabase/schema.sql), and click **Run**. This creates all
tables, security rules, and seed data (cabins, a sample agenda, and locations).

### 3. Add yourself as an admin
At the bottom of `schema.sql` there's a commented-out line. Run this in the SQL
editor with your real email(s):

```sql
insert into admins (email, name) values ('you@example.com', 'Your Name')
  on conflict (email) do nothing;
```

### 4. Get your API keys
Supabase → **Settings → API**. You'll need:
- **Project URL**
- **anon public** key
- **service_role** key (secret — server only)

### 5. Configure environment variables
Copy `.env.example` to `.env.local` and fill it in:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
ADMIN_ALLOWLIST=you@example.com,buddy@example.com
```

`ADMIN_ALLOWLIST` is the set of emails allowed to create an organizer account.

### 6. (Optional) Turn off email confirmation
So organizers can sign up and use the dashboard immediately:
Supabase → **Authentication → Providers → Email** → turn **Confirm email** off.
(If you leave it on, organizers must click a confirmation email before signing in.)

### 7. Run it
```bash
npm install
npm run dev
```
Open http://localhost:3000. Create your organizer account at
**/admin** → "Create account" using an allowlisted email.

---

## Deploying to Vercel + mensfishingtrip.com

1. Push this repo to GitHub (already pointed at
   `github.com/rhendricksontu/mensfishingtrip`).
2. At [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Add the same four env vars from `.env.local` in **Settings → Environment Variables**.
4. Deploy.
5. **Settings → Domains** → add `mensfishingtrip.com`. Vercel shows the DNS records
   to set at your domain registrar. (`www` → CNAME, root → A/ALIAS per Vercel's
   instructions.)

---

## Customizing trip details

Most copy and constants live in [`src/lib/config.ts`](src/lib/config.ts):
trip name/dates, the **$90** amount, the Venmo handle **@yomikeywhitey**, and the
departure-time options.

The agenda, locations, cabins, and fishing groups are seeded by `schema.sql` and
can be expanded from the admin dashboard (cabins, fishing groups) or edited directly
in Supabase's Table Editor (agenda items, locations).

---

## How privacy works

There's no public list of attendees. RSVP data (phones, emergency contacts) and
payment/ride status are only reachable through server code using the Supabase
`service_role` key, which never reaches the browser. The tables have Row Level
Security on with no public policies, so the anon key can't read them directly.
The organizer dashboard additionally checks that the logged-in user's email is in
the `admins` table.
