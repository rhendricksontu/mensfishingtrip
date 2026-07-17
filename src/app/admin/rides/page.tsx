import { requireAdmin } from "@/lib/require-admin";
import { getAttendees, getRides, getRidePassengers, getVisibility } from "@/lib/data";
import RidesClient from "@/components/admin/RidesClient";
import VisibilityToggle from "@/components/admin/VisibilityToggle";

export const dynamic = "force-dynamic";

export default async function RidesAdminPage() {
  await requireAdmin();
  const [attendees, rides, ridePassengers, visibility] = await Promise.all([
    getAttendees(),
    getRides(),
    getRidePassengers(),
    getVisibility(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-brand-800">Ride Tracking</h2>
        <p className="text-sm text-brand-600">
          Drivers (who offered seats at RSVP) appear automatically.
        </p>
      </div>
      <VisibilityToggle
        settingKey="show_rides"
        initial={visibility.show_rides}
        label="Show Ride Assignments to Attendees"
      />
      <RidesClient attendees={attendees} rides={rides} ridePassengers={ridePassengers} />
    </div>
  );
}
