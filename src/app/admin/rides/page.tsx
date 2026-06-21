import { requireAdmin } from "@/lib/require-admin";
import { getAttendees, getRides, getRidePassengers } from "@/lib/data";
import RidesClient from "@/components/admin/RidesClient";

export const dynamic = "force-dynamic";

export default async function RidesAdminPage() {
  await requireAdmin();
  const [attendees, rides, ridePassengers] = await Promise.all([
    getAttendees(),
    getRides(),
    getRidePassengers(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-pine-800">Ride Tracking</h2>
        <p className="text-sm text-pine-600">
          Who&apos;s riding with whom, and when each car leaves and arrives — both directions.
          Organizer-only.
        </p>
      </div>
      <RidesClient attendees={attendees} rides={rides} ridePassengers={ridePassengers} />
    </div>
  );
}
