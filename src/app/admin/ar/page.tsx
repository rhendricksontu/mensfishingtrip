import { requireAdmin } from "@/lib/require-admin";
import { getAttendees } from "@/lib/data";
import { PAYMENT } from "@/lib/config";
import ARClient from "@/components/admin/ARClient";

export const dynamic = "force-dynamic";

export default async function AccountsReceivablePage() {
  await requireAdmin();
  const attendees = await getAttendees();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-brand-800">Accounts Receivable</h2>
        <p className="text-sm text-brand-600">
          Track who has paid the ${PAYMENT.amount} trip cost and who still owes.
        </p>
      </div>
      <ARClient attendees={attendees} />
    </div>
  );
}
