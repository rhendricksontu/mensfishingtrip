import { requireAdmin } from "@/lib/require-admin";
import { getAttendees, getCabins, getFishingGroups } from "@/lib/data";
import RosterClient from "@/components/admin/RosterClient";

export const dynamic = "force-dynamic";

export default async function RosterPage() {
  await requireAdmin();
  const [attendees, cabins, groups] = await Promise.all([
    getAttendees(),
    getCabins(),
    getFishingGroups(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-brand-800">Roster & Payments</h2>
        <p className="text-sm text-brand-600">
          Toggle payment, assign cabins, hosts, and fishing groups. Tap a phone to call.
        </p>
      </div>
      {attendees.length === 0 ? (
        <div className="card text-brand-600">No RSVPs yet.</div>
      ) : (
        <RosterClient attendees={attendees} cabins={cabins} groups={groups} />
      )}
    </div>
  );
}
