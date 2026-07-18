import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getCurrentAttendee } from "@/lib/attendee";
import AgendaView from "@/components/AgendaView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Signed-in members land on My Trip. Admins who log in by email (no attendee
  // row) still see the agenda here; everyone else sees the welcome screen.
  const me = await getCurrentAttendee();
  if (me) redirect("/me");
  const isAuthed = Boolean(await getSessionUser());
  if (isAuthed) return <AgendaView />;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-full max-w-2xl">
        <Image
          src="/logo.png"
          alt="11th Annual Men's Fishing Trip, Mountain Fork River, Broken Bow, Oklahoma, September 25-27, 2026"
          width={1242}
          height={1242}
          priority
          className="h-auto w-full"
        />
      </div>

      <div className="mt-9 inline-flex flex-col items-stretch gap-4">
        <Link href="/rsvp" className="btn-primary w-full py-3 text-base shadow-sm">
          RSVP
        </Link>

        <p className="text-center text-sm text-brand-600">
          Already RSVP&apos;d?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800"
          >
            Please log in.
          </Link>
        </p>
      </div>
    </div>
  );
}
