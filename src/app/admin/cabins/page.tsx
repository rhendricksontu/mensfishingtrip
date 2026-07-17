import { requireAdmin } from "@/lib/require-admin";
import {
  getAttendees,
  getCabins,
  getRides,
  getRidePassengers,
  getSignups,
  getSignupLeaders,
  getVisibility,
} from "@/lib/data";
import CabinsClient from "@/components/admin/CabinsClient";
import VisibilityToggle from "@/components/admin/VisibilityToggle";

export const dynamic = "force-dynamic";

export default async function CabinsAdminPage() {
  await requireAdmin();
  const [cabins, attendees, rides, ridePassengers, signups, signupLeaders, visibility] =
    await Promise.all([
      getCabins(),
      getAttendees(),
      getRides(),
      getRidePassengers(),
      getSignups(),
      getSignupLeaders(),
      getVisibility(),
    ]);

  // Anyone who volunteered (as a leader or an assigned volunteer) — used to
  // flag which unassigned travelers still need a cabin for their duties.
  const volunteerIds = Array.from(
    new Set([
      ...signups.map((s) => s.attendee_id).filter((id): id is string => Boolean(id)),
      ...signupLeaders.map((l) => l.attendee_id).filter((id): id is string => Boolean(id)),
    ])
  );

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
        label="Show Cabin Assignments to Attendees"
      />
      <CabinsClient
        cabins={cabins}
        attendees={attendees}
        rides={rides}
        ridePassengers={ridePassengers}
        volunteerIds={volunteerIds}
      />
    </div>
  );
}
