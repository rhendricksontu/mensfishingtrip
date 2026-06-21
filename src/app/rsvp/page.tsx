import Link from "next/link";
import RsvpForm from "@/components/RsvpForm";
import { PAYMENT } from "@/lib/config";

export const metadata = { title: "RSVP · Men's Fishing Trip" };

export default function RsvpPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-pine-800">RSVP</h1>
        <p className="mt-1 text-pine-600">
          Let us know you&apos;re coming. It takes about a minute.
        </p>
      </div>

      <div className="rounded-lg bg-white px-4 py-3 text-sm text-pine-700 ring-1 ring-pine-100">
        Already RSVP&apos;d and need to change something?{" "}
        <Link href="/rsvp/edit" className="font-semibold text-pine-700 underline">
          Edit your RSVP
        </Link>
        .
      </div>

      <RsvpForm />

      <p className="text-center text-xs text-pine-400">
        Remember: ${PAYMENT.amount} on Venmo to {PAYMENT.venmoHandle} covers your spot.
      </p>
    </div>
  );
}
