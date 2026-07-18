import { requireAdmin } from "@/lib/require-admin";
import { getCoffeeOrders, getAttendees } from "@/lib/data";
import CoffeeClient from "@/components/admin/CoffeeClient";

export const dynamic = "force-dynamic";

export default async function CoffeePage() {
  await requireAdmin();
  const [orders, attendees] = await Promise.all([getCoffeeOrders(), getAttendees()]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-brand-800">Coffee Queue</h2>
        <p className="text-sm text-brand-600">
          Orders are sorted by pickup time. Tap “Ready for Pickup” when a drink
          is ready. The attendee gets a banner on their My Trip page and confirms
          pickup to clear it. You can also clear the order from the queue once it
          has been picked up rather than waiting on the attendee to clear it.
        </p>
      </div>
      <CoffeeClient orders={orders} attendees={attendees} />
    </div>
  );
}
