import { requireAdmin } from "@/lib/require-admin";
import { getGolf, getAttendees } from "@/lib/data";
import GolfClient from "@/components/admin/GolfClient";

export const dynamic = "force-dynamic";

export default async function GolfAdminPage() {
  await requireAdmin();
  const [golf, attendees] = await Promise.all([getGolf(), getAttendees()]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-brand-800">Golf</h2>
        <p className="text-sm text-brand-600">
          Assign a leader to organize golf. The leader (or you) sets the title, start
          time, location, and notes — which show on My Trip for anyone who chose Golfing
          as an activity.
        </p>
      </div>
      <GolfClient golf={golf} attendees={attendees} />
    </div>
  );
}
