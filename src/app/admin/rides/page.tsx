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
        <h2 className="text-lg font-bold text-brand-800">Ride Tracking</h2>
        <p className="text-sm text-brand-600">
          Drivers (who offered seats at RSVP) appear automatically. Tap the edit icon to
          assign passengers and set times, both directions. Organizer-only.
        </p>
      </div>
      <RidesClient attendees={attendees} rides={rides} ridePassengers={ridePassengers} />
    </div>
  );
}
