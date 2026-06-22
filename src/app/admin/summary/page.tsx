import { requireAdmin } from "@/lib/require-admin";
import {
  getAttendees,
  getCabins,
  getFishingGroups,
  getRides,
  getRidePassengers,
} from "@/lib/data";
import SummaryClient from "@/components/admin/SummaryClient";

export const dynamic = "force-dynamic";

export default async function SummaryPage() {
  await requireAdmin();
  const [attendees, cabins, groups, rides, ridePassengers] = await Promise.all([
    getAttendees(),
    getCabins(),
    getFishingGroups(),
    getRides(),
    getRidePassengers(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-brand-800">Summary</h2>
        <p className="text-sm text-brand-600">
          Everyone who has RSVP&apos;d. Tap a name for their cabin, fishing group, driver, and
          payment.
        </p>
      </div>
      <SummaryClient
        attendees={attendees}
        cabins={cabins}
        groups={groups}
        rides={rides}
        ridePassengers={ridePassengers}
      />
    </div>
  );
}
