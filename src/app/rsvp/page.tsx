import Link from "next/link";
import { redirect } from "next/navigation";
import RsvpForm from "@/components/RsvpForm";
import { getCurrentAttendee } from "@/lib/attendee";

export const metadata = { title: "RSVP · Men's Fishing Trip" };
export const dynamic = "force-dynamic";

export default async function RsvpPage() {
  // Already logged in? Send them to their dashboard.
  const me = await getCurrentAttendee();
  if (me) redirect("/me");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">RSVP</h1>
        <p className="mt-1 text-brand-600">
          Sign up for the fishing trip and create your account. It takes about a minute.
        </p>
      </div>

      <div className="rounded-lg bg-white px-4 py-3 text-sm text-brand-700 ring-1 ring-brand-100">
        Already RSVP&apos;d?{" "}
        <Link href="/login" className="font-semibold text-brand-700 underline">
          Log in
        </Link>{" "}
        to see your ride, cabin, and fishing group info.
      </div>

      <RsvpForm />
    </div>
  );
}
