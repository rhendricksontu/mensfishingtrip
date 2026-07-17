import { requireAdmin } from "@/lib/require-admin";
import {
  getAttendees,
  getFishingGroups,
  getTripLocations,
  getRides,
  getRidePassengers,
  getVisibility,
} from "@/lib/data";
import FishingClient from "@/components/admin/FishingClient";
import VisibilityToggle from "@/components/admin/VisibilityToggle";

export const dynamic = "force-dynamic";

export default async function FishingAdminPage() {
  await requireAdmin();
  const [groups, attendees, locations, rides, ridePassengers, visibility] = await Promise.all([
    getFishingGroups(),
    getAttendees(),
    getTripLocations(),
    getRides(),
    getRidePassengers(),
    getVisibility(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-brand-800">Fishing Sessions & Groups</h2>
        <p className="text-sm text-brand-600">
          Saturday morning and afternoon. Add a guide, set their capacity, and assign
          members to each guide.
        </p>
      </div>
      <VisibilityToggle
        settingKey="show_fishing"
        initial={visibility.show_fishing}
        label="Show fishing assignments to attendees"
      />
      <FishingClient
        groups={groups}
        attendees={attendees}
        locations={locations}
        rides={rides}
        ridePassengers={ridePassengers}
      />
    </div>
  );
}
