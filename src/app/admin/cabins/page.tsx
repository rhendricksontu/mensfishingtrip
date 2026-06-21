import { requireAdmin } from "@/lib/require-admin";
import { getAttendees, getCabins } from "@/lib/data";
import CabinsClient from "@/components/admin/CabinsClient";

export const dynamic = "force-dynamic";

export default async function CabinsAdminPage() {
  await requireAdmin();
  const [cabins, attendees] = await Promise.all([getCabins(), getAttendees()]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-pine-800">Cabins & Hosts</h2>
        <p className="text-sm text-pine-600">
          Each occupied cabin needs at least one host. Assign men to cabins on the Roster tab.
        </p>
      </div>
      <CabinsClient cabins={cabins} attendees={attendees} />
    </div>
  );
}
