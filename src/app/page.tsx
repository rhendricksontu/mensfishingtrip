import Link from "next/link";
import { TRIP } from "@/lib/config";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center text-center">
      <section className="w-full overflow-hidden rounded-3xl bg-gradient-to-b from-brand-600 via-brand-700 to-brand-900 px-6 py-16 text-white shadow-xl sm:py-24">
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

        <div className="mt-10 flex flex-col items-center gap-4">
          <Link
            href="/rsvp"
            className="btn bg-white px-10 py-3 text-base text-brand-700 shadow-sm hover:bg-brand-50"
          >
            RSVP
          </Link>

          <p className="text-sm text-brand-100">
            Already RSVP&apos;d?{" "}
            <Link href="/login" className="font-semibold text-white underline underline-offset-2 hover:text-brand-100">
              Please sign in.
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
