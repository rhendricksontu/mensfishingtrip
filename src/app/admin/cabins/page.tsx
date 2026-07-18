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

  // Each volunteer's assignment(s), labeled by role + day, so unassigned
  // volunteers can be grouped by what they're volunteering for.
  const ROLE_LABELS: Record<string, string> = {
    breakfast_cook: "Breakfast Cook",
    coffee_maker: "Coffee Maker",
    guide_lunch: "Guide Lunch Maker",
  };
  // Every volunteer role is a single crew now, so labels don't call out a day.
  const volunteerAssignments = [
    ...signups
      .filter((s) => s.attendee_id)
      .map((s) => ({
        attendee_id: s.attendee_id as string,
        label: `${ROLE_LABELS[s.role] ?? s.role}s`,
      })),
    ...signupLeaders
      .filter((l) => l.attendee_id)
      .map((l) => ({
        attendee_id: l.attendee_id as string,
        label: `${ROLE_LABELS[l.role] ?? l.role} Leader`,
      })),
  ];

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
        volunteerAssignments={volunteerAssignments}
      />
    </div>
  );
}
