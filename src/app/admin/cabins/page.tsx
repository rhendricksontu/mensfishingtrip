import { requireAdmin } from "@/lib/require-admin";
import { getAttendees, getCabins, getRides, getRidePassengers, getVisibility } from "@/lib/data";
import CabinsClient from "@/components/admin/CabinsClient";
import VisibilityToggle from "@/components/admin/VisibilityToggle";

export const dynamic = "force-dynamic";

export default async function CabinsAdminPage() {
  await requireAdmin();
  const [cabins, attendees, rides, ridePassengers, visibility] = await Promise.all([
    getCabins(),
    getAttendees(),
    getRides(),
    getRidePassengers(),
    getVisibility(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-brand-800">Cabins & Hosts</h2>
        <p className="text-sm text-brand-600">
          Set each cabin&apos;s name, address, and capacity; assign members and mark a
          host.
        </p>
      </div>
      <VisibilityToggle
        settingKey="show_cabins"
        initial={visibility.show_cabins}
        label="Show cabin assignments to attendees"
      />
      <CabinsClient
        cabins={cabins}
        attendees={attendees}
        rides={rides}
        ridePassengers={ridePassengers}
      />
    </div>
  );
}
