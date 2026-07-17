import { requireAdmin } from "@/lib/require-admin";
import { getAttendees, getCabins, getRides, getRidePassengers } from "@/lib/data";
import CabinsClient from "@/components/admin/CabinsClient";

export const dynamic = "force-dynamic";

export default async function CabinsAdminPage() {
  await requireAdmin();
  const [cabins, attendees, rides, ridePassengers] = await Promise.all([
    getCabins(),
    getAttendees(),
    getRides(),
    getRidePassengers(),
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
      <CabinsClient
        cabins={cabins}
        attendees={attendees}
        rides={rides}
        ridePassengers={ridePassengers}
      />
    </div>
  );
}
