import { requireAdmin } from "@/lib/require-admin";
import { getAttendees, getFishingGroups } from "@/lib/data";
import FishingClient from "@/components/admin/FishingClient";

export const dynamic = "force-dynamic";

export default async function FishingAdminPage() {
  await requireAdmin();
  const [groups, attendees] = await Promise.all([getFishingGroups(), getAttendees()]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-brand-800">Fishing Sessions & Groups</h2>
        <p className="text-sm text-brand-600">
          Saturday morning and afternoon. Add a guide, set their capacity, and assign
          members to each guide.
        </p>
      </div>
      <FishingClient groups={groups} attendees={attendees} />
    </div>
  );
}
