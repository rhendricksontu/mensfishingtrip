import { requireAdmin } from "@/lib/require-admin";
import { getSignupLeaders, getAttendees, getVisibility } from "@/lib/data";
import AdminVolunteersClient from "@/components/admin/AdminVolunteersClient";
import VisibilityToggle from "@/components/admin/VisibilityToggle";

export const dynamic = "force-dynamic";

export default async function AdminVolunteersPage() {
  await requireAdmin();
  const [leaders, attendees, visibility] = await Promise.all([
    getSignupLeaders(),
    getAttendees(),
    getVisibility(),
  ]);
  const members = attendees
    .map((a) => ({ id: a.id, name: a.name, phone: a.phone }))
    .sort((x, y) => x.name.localeCompare(y.name));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-brand-800">Volunteer Leaders</h2>
        <p className="text-sm text-brand-600">
          Assign a leader for each meal. Leaders then assign their volunteers on the
          Volunteers tab.
        </p>
      </div>
      <VisibilityToggle
        settingKey="show_volunteers"
        initial={visibility.show_volunteers}
        label="Show Volunteering to Attendees"
      />
      <AdminVolunteersClient leaders={leaders} members={members} />
    </div>
  );
}
