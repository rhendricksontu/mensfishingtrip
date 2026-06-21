import Link from "next/link";
import { TRIP, PAYMENT } from "@/lib/config";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Hero */}
      <section className="w-full overflow-hidden rounded-3xl bg-gradient-to-b from-brand-600 via-brand-700 to-brand-900 px-6 py-14 text-white shadow-xl sm:py-20">
        <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ring-1 ring-inset ring-white/25">
          {TRIP.edition}
        </span>

        <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          2026 Men&apos;s<br className="sm:hidden" /> Fishing Trip
        </h1>

        <p className="mx-auto mt-5 max-w-md text-base font-medium text-brand-100 sm:text-lg">
          Friday, September&nbsp;25, 2026
          <span className="mx-2 text-brand-300">–</span>
          Sunday, September&nbsp;27, 2026
        </p>

        <p className="mt-2 text-sm font-medium uppercase tracking-widest text-brand-200">
          {TRIP.location}
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/rsvp"
            className="btn w-full bg-white px-7 text-brand-700 shadow-sm hover:bg-brand-50 sm:w-auto"
          >
            RSVP Now
          </Link>
          <Link
            href="/agenda"
            className="btn w-full bg-white/10 px-7 text-white ring-1 ring-inset ring-white/30 hover:bg-white/20 sm:w-auto"
          >
            View Agenda
          </Link>
        </div>
      </section>

      {/* Quiet payment line */}
      <p className="mt-6 text-sm text-brand-600">
        Trip cost{" "}
        <span className="font-semibold text-brand-800">${PAYMENT.amount}</span> ·{" "}
        <a
          href={PAYMENT.venmoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-700"
        >
          Venmo {PAYMENT.venmoHandle}
        </a>
      </p>

      {/* Minimal quick links */}
      <nav className="mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickLink href="/rsvp" emoji="📝" label="RSVP" />
        <QuickLink href="/agenda" emoji="🗓️" label="Agenda" />
        <QuickLink href="/signups" emoji="🍳" label="Signups" />
        <QuickLink href="/locations" emoji="📍" label="Locations" />
      </nav>
    </div>
  );
}

function QuickLink({
  href,
  emoji,
  label,
}: {
  href: string;
  emoji: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 rounded-2xl bg-white px-4 py-5 font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-200"
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-sm">{label}</span>
    </Link>
  );
}
