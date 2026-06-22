import { getSignups, getAttendees } from "@/lib/data";
import { getCurrentAttendee } from "@/lib/attendee";
import { getAdminUser } from "@/lib/auth";
import SignupBoard from "@/components/SignupBoard";

export const metadata = { title: "Signups · Men's Fishing Trip" };
export const dynamic = "force-dynamic";

export default async function SignupsPage() {
  const [signups, attendees, me, admin] = await Promise.all([
    getSignups(),
    getAttendees(),
    getCurrentAttendee(),
    getAdminUser(),
  ]);

  // Phone by attendee id, so each volunteer can be listed with their number.
  const phoneById: Record<string, string> = {};
  for (const a of attendees) phoneById[a.id] = a.phone;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Breakfast, Coffee & Guide Lunches</h1>
        <p className="mt-1 text-brand-600">
          A weekend runs on coffee, a hot breakfast, and well-fed guides. Grab a slot below.
        </p>
      </div>
      <SignupBoard
        signups={signups}
        phoneById={phoneById}
        currentAttendeeId={me?.id ?? null}
        isAdmin={Boolean(admin)}
      />
    </div>
  );
}
