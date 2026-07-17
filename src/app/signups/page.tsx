import { redirect } from "next/navigation";
import { getSignups, getSignupLeaders, getAttendees } from "@/lib/data";
import { getCurrentAttendee } from "@/lib/attendee";
import { getAdminUser } from "@/lib/auth";
import SignupBoard from "@/components/SignupBoard";

export const metadata = { title: "Volunteers · Men's Fishing Trip" };
export const dynamic = "force-dynamic";

export default async function SignupsPage() {
  const [signups, leaders, attendees, me, admin] = await Promise.all([
    getSignups(),
    getSignupLeaders(),
    getAttendees(),
    getCurrentAttendee(),
    getAdminUser(),
  ]);

  const isAdmin = Boolean(admin);
  const isLeader = me ? leaders.some((l) => l.attendee_id === me.id) : false;
  // Only organizers and leaders may view this page. Volunteers see their role
  // on the My Trip page instead.
  if (!isAdmin && !isLeader) redirect("/");

  // Phone by attendee id, so each helper can be listed with their number.
  const phoneById: Record<string, string> = {};
  for (const a of attendees) phoneById[a.id] = a.phone;
  const members = attendees
    .map((a) => ({ id: a.id, name: a.name, phone: a.phone }))
    .sort((x, y) => x.name.localeCompare(y.name));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Breakfast, Coffee & Guide Lunches</h1>
        <p className="mt-1 text-brand-600">
          Leaders assign their volunteers for each meal.
        </p>
      </div>
      <SignupBoard
        signups={signups}
        leaders={leaders}
        members={members}
        phoneById={phoneById}
        currentAttendeeId={me?.id ?? null}
        isAdmin={isAdmin}
      />
    </div>
  );
}
