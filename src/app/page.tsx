import Link from "next/link";
import { TRIP, PAYMENT } from "@/lib/config";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-pine-700 to-pine-600 p-7 text-white shadow">
        <p className="text-sm font-semibold uppercase tracking-wide text-pine-100">
          {TRIP.location}
        </p>
        <h1 className="mt-1 text-3xl font-bold leading-tight">{TRIP.name}</h1>
        <p className="mt-2 text-pine-100">{TRIP.datesLabel}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/rsvp" className="btn bg-white text-pine-700 hover:bg-pine-50">
            RSVP Now
          </Link>
          <Link href="/agenda" className="btn bg-pine-800/40 text-white ring-1 ring-inset ring-white/30 hover:bg-pine-800/60">
            View Agenda
          </Link>
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-bold text-pine-800">💵 Trip Cost — ${PAYMENT.amount}</h2>
        <p className="mt-1 text-sm text-pine-600">{PAYMENT.description}</p>
        <p className="mt-3 text-sm">
          Send <span className="font-semibold">${PAYMENT.amount}</span> on Venmo to{" "}
          <span className="font-semibold text-pine-700">{PAYMENT.venmoHandle}</span>.
        </p>
        <a
          href={PAYMENT.venmoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-3"
        >
          Pay ${PAYMENT.amount} on Venmo
        </a>
        <p className="mt-2 text-xs text-pine-400">
          After you pay, please still submit your RSVP so we can plan cabins and rides.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <HomeCard
          href="/rsvp"
          emoji="📝"
          title="RSVP"
          body="Tell us you're coming, your ride preference, and emergency contact."
        />
        <HomeCard
          href="/agenda"
          emoji="🗓️"
          title="Daily Agenda"
          body="Speakers, fishing sessions, dinners, and Sunday's river sermon."
        />
        <HomeCard
          href="/signups"
          emoji="🍳"
          title="Signups"
          body="Volunteer to cook breakfast or make the morning coffee."
        />
        <HomeCard
          href="/locations"
          emoji="📍"
          title="Locations"
          body="Cabins, dinner spots, and the river — with map links."
        />
      </section>
    </div>
  );
}

function HomeCard({
  href,
  emoji,
  title,
  body,
}: {
  href: string;
  emoji: string;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="card transition hover:shadow-md hover:ring-pine-200">
      <div className="text-2xl">{emoji}</div>
      <h3 className="mt-2 font-bold text-pine-800">{title}</h3>
      <p className="mt-1 text-sm text-pine-600">{body}</p>
    </Link>
  );
}
