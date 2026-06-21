import Link from "next/link";
import RsvpForm from "@/components/RsvpForm";
import { PAYMENT } from "@/lib/config";

export const metadata = { title: "RSVP · Men's Fishing Trip" };

export default function RsvpPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">RSVP</h1>
        <p className="mt-1 text-brand-600">
          Let us know you&apos;re coming. It takes about a minute.
        </p>
      </div>

      <div className="rounded-lg bg-white px-4 py-3 text-sm text-brand-700 ring-1 ring-brand-100">
        Already RSVP&apos;d and need to change something?{" "}
        <Link href="/rsvp/edit" className="font-semibold text-brand-700 underline">
          Edit your RSVP
        </Link>
        .
      </div>

      <RsvpForm />

      <p className="text-center text-xs text-brand-400">
        Remember: ${PAYMENT.amount} on Venmo to {PAYMENT.venmoHandle} covers your spot.
      </p>
    </div>
  );
}
