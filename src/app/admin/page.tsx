import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { getAttendees, getCabins } from "@/lib/data";
import { PAYMENT } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const [attendees, cabins] = await Promise.all([getAttendees(), getCabins()]);

  const total = attendees.length;
  const paid = attendees.filter((a) => a.paid).length;
  const unpaid = total - paid;
  const drivers = attendees.filter((a) => a.willing_to_drive).length;
  const seats = attendees
    .filter((a) => a.willing_to_drive)
    .reduce((sum, a) => sum + (a.seat_capacity || 0), 0);
  const needRide = attendees.filter((a) => a.needs_ride).length;
  const unassignedCabin = attendees.filter((a) => !a.cabin_id).length;
  const unassignedSession = attendees.filter((a) => !a.assigned_session).length;

  // Cabins missing a host (the rule: at least one host per cabin).
  const cabinsNoHost = cabins.filter(
    (c) =>
      attendees.some((a) => a.cabin_id === c.id) &&
      !attendees.some((a) => a.cabin_id === c.id && a.is_cabin_host)
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="RSVPs" value={total} />
        <Stat label="Paid" value={`${paid}`} tone="good" />
        <Stat label="Unpaid" value={`${unpaid}`} tone={unpaid ? "warn" : "good"} />
        <Stat label="Open seats" value={seats} />
        <Stat label="Willing drivers" value={drivers} />
        <Stat label="Need a ride" value={needRide} tone={needRide ? "warn" : "good"} />
        <Stat label="No cabin yet" value={unassignedCabin} tone={unassignedCabin ? "warn" : "good"} />
        <Stat label="No session yet" value={unassignedSession} tone={unassignedSession ? "warn" : "good"} />
      </div>

      <section className="card">
        <h2 className="font-bold text-brand-800">Money collected</h2>
        <p className="mt-1 text-sm text-brand-600">
          {paid} of {total} paid · ${paid * PAYMENT.amount} collected ·{" "}
          <span className="font-semibold text-amber-700">${unpaid * PAYMENT.amount}</span> outstanding
        </p>
        <Link href="/admin/roster" className="btn-secondary mt-3">
          Manage Payments in Roster →
        </Link>
      </section>

      <section className="card">
        <h2 className="font-bold text-brand-800">Cabin host check</h2>
        {cabinsNoHost.length === 0 ? (
          <p className="mt-1 text-sm text-brand-600">
            Every occupied cabin has at least one host.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            <p className="text-sm text-amber-700">
              These cabins have people but <span className="font-semibold">no host assigned</span>:
            </p>
            <ul className="list-inside list-disc text-sm text-brand-700">
              {cabinsNoHost.map((c) => (
                <li key={c.id}>{c.name}</li>
              ))}
            </ul>
            <Link href="/admin/cabins" className="btn-secondary mt-1">
              Assign Hosts →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "good" | "warn";
}) {
  const toneClass =
    tone === "good"
      ? "text-brand-700"
      : tone === "warn"
        ? "text-amber-700"
        : "text-brand-800";
  return (
    <div className="card py-4">
      <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
      <div className="text-xs font-medium text-brand-500">{label}</div>
    </div>
  );
}
