import { requireAttendee } from "@/lib/attendee";
import {
  getAttendees,
  getCabins,
  getFishingGroups,
  getRides,
  getRidePassengers,
} from "@/lib/data";
import { PAYMENT, SESSION_LABELS } from "@/lib/config";
import { formatPhone, normalizePhone, addressLines, addressOneLine } from "@/lib/utils";
import MyInfoForm from "@/components/MyInfoForm";
import MapLink from "@/components/MapLink";
import type { Attendee, RideDirection } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Fishing Trip · Men's Fishing Trip" };

export default async function MyTripPage() {
  const me = await requireAttendee();
  const [attendees, cabins, groups, rides, ridePassengers] = await Promise.all([
    getAttendees(),
    getCabins(),
    getFishingGroups(),
    getRides(),
    getRidePassengers(),
  ]);

  const byId = new Map(attendees.map((a) => [a.id, a]));

  // Cabin
  const cabin = cabins.find((c) => c.id === me.cabin_id) || null;
  const cabinmates = me.cabin_id
    ? attendees.filter((a) => a.cabin_id === me.cabin_id && a.id !== me.id)
    : [];
  const hosts = me.cabin_id
    ? attendees.filter((a) => a.cabin_id === me.cabin_id && a.is_cabin_host)
    : [];

  // Fishing
  const group = groups.find((g) => g.id === me.fishing_group_id) || null;
  const groupmates = me.fishing_group_id
    ? attendees.filter((a) => a.fishing_group_id === me.fishing_group_id && a.id !== me.id)
    : [];

  // Groups this member is guiding (if any), with their anglers.
  const guidingGroups = groups
    .filter((g) => g.guide_attendee_id === me.id)
    .map((g) => ({
      group: g,
      anglers: attendees.filter((a) => a.fishing_group_id === g.id),
    }));

  // The car I'm in for a single direction (explicit only).
  function findRide(direction: RideDirection) {
    const dirRides = rides.filter((r) => r.direction === direction);
    const asDriver = dirRides.find((r) => r.driver_id === me.id);
    const passengerLink = ridePassengers.find(
      (p) => p.attendee_id === me.id && dirRides.some((r) => r.id === p.ride_id)
    );
    const ride = asDriver || dirRides.find((r) => r.id === passengerLink?.ride_id);
    if (!ride) return null;
    const driver = ride.driver_id ? byId.get(ride.driver_id) || null : null;
    const passengers = ridePassengers
      .filter((p) => p.ride_id === ride.id)
      .map((p) => byId.get(p.attendee_id))
      .filter(Boolean) as Attendee[];
    return { ride, driver, passengers, iAmDriver: Boolean(asDriver) };
  }

  // Coming-home inherits the ride to Broken Bow until it's customized.
  function rideInfo(direction: RideDirection) {
    return findRide(direction) ?? (direction === "from_trip" ? findRide("to_trip") : null);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">My Fishing Trip</h1>
        <p className="text-sm text-brand-500">Welcome, {me.name.split(" ")[0]}!</p>
      </div>

      {/* Payment */}
      {me.paid ? (
        <div className="card bg-brand-50">
          <div>
            <p className="font-semibold text-brand-800">You&apos;re paid up. Thank you!</p>
            <p className="text-sm text-brand-600">${PAYMENT.amount} received.</p>
          </div>
        </div>
      ) : (
        <div className="card border-l-4 border-amber-400">
          <p className="font-semibold text-brand-800">Fishing Trip Cost: ${PAYMENT.amount} (not yet received)</p>
          <p className="mt-1 text-sm text-brand-600">
            Send ${PAYMENT.amount} on Venmo to{" "}
            <span className="font-semibold">{PAYMENT.venmoHandle}</span>.
          </p>
          <a href={PAYMENT.venmoUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-3">
            Pay ${PAYMENT.amount} on Venmo
          </a>
          <p className="mt-2 text-xs text-brand-400">Already paid? It&apos;ll update once an organizer confirms it.</p>
        </div>
      )}

      {/* Assignments */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Cabin */}
        <div className="card">
          <h2 className="font-bold text-brand-800">Cabin</h2>
          {cabin ? (
            <>
              <p className="mt-1 text-lg font-semibold text-brand-700">{cabin.name}</p>
              {addressOneLine(cabin) && (
                <MapLink
                  place={addressOneLine(cabin)}
                  className="mt-1 inline-block text-sm font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
                >
                  {addressLines(cabin).join(", ")}
                </MapLink>
              )}
              {me.is_cabin_host && (
                <span className="badge mt-2 bg-olive-600 text-white">You&apos;re a cabin host</span>
              )}
              {hosts.length > 0 && !me.is_cabin_host && (
                <p className="mt-1 text-sm text-brand-600">
                  Host:{" "}
                  {hosts.map((h, i) => (
                    <span key={h.id}>
                      {i > 0 && ", "}
                      {h.name} <PhoneLink phone={h.phone} />
                    </span>
                  ))}
                </p>
              )}
              {cabinmates.length > 0 && (
                <p className="mt-2 text-sm text-brand-600">
                  <span className="font-medium text-brand-700">Cabinmates:</span>{" "}
                  {cabinmates.map((a, i) => (
                    <span key={a.id}>
                      {i > 0 && ", "}
                      {a.name} <PhoneLink phone={a.phone} />
                    </span>
                  ))}
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-sm text-brand-400">Not assigned yet. Check back soon.</p>
          )}
        </div>

        {/* Fishing */}
        <div className="card">
          <h2 className="font-bold text-brand-800">Fishing</h2>
          {me.assigned_session ? (
            <p className="mt-1 text-lg font-semibold text-brand-700">
              {SESSION_LABELS[me.assigned_session]}
            </p>
          ) : (
            <p className="mt-1 text-sm text-brand-400">Session not assigned yet.</p>
          )}
          {group && (
            <>
              <p className="mt-1 text-sm text-brand-700">
                Guide: <span className="font-medium">{group.guide_name || group.name}</span>
                {group.guide_phone && (
                  <>
                    {" "}
                    <PhoneLink phone={group.guide_phone} />
                  </>
                )}
              </p>
              {groupmates.length > 0 && (
                <p className="mt-2 text-sm text-brand-600">
                  <span className="font-medium text-brand-700">With:</span>{" "}
                  {groupmates.map((a, i) => (
                    <span key={a.id}>
                      {i > 0 && ", "}
                      {a.name} <PhoneLink phone={a.phone} />
                    </span>
                  ))}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* You're Guiding (for member-guides) */}
      {guidingGroups.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-brand-800">You&apos;re Guiding</h2>
          <div className="mt-2 space-y-4">
            {guidingGroups.map(({ group: g, anglers }) => (
              <div key={g.id}>
                <p className="text-sm font-semibold text-brand-700">
                  {SESSION_LABELS[g.session]}
                  <span className="ml-2 text-xs font-normal text-brand-500">
                    {anglers.length}
                    {g.capacity > 0 ? ` / ${g.capacity}` : ""} anglers
                  </span>
                </p>
                {anglers.length > 0 ? (
                  <ul className="mt-1 space-y-0.5 text-sm text-brand-600">
                    {anglers.map((a) => (
                      <li key={a.id}>
                        {a.name} <PhoneLink phone={a.phone} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-brand-400">No anglers assigned yet.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rides */}
      <div className="card">
        <h2 className="font-bold text-brand-800">Your Rides</h2>
        <div className="mt-2 space-y-4">
          <RideBlock title="To Broken Bow" direction="to_trip" info={rideInfo("to_trip")} meId={me.id} />
          <RideBlock title="Coming Home" direction="from_trip" info={rideInfo("from_trip")} meId={me.id} />
        </div>
      </div>

      {/* Editable details */}
      <MyInfoForm attendee={me} />
    </div>
  );
}

function RideBlock({
  title,
  direction,
  info,
  meId,
}: {
  title: string;
  direction: RideDirection;
  info: {
    driver: Attendee | null;
    passengers: Attendee[];
    iAmDriver: boolean;
  } | null;
  meId: string;
}) {
  return (
    <div className="rounded-lg bg-brand-50 p-3">
      <p className="text-sm font-semibold text-brand-700">{title}</p>
      {!info ? (
        <p className="text-sm text-brand-400">Not arranged yet.</p>
      ) : (
        <RideDetails direction={direction} info={info} meId={meId} />
      )}
    </div>
  );
}

function RideDetails({
  direction,
  info,
  meId,
}: {
  direction: RideDirection;
  info: { driver: Attendee | null; passengers: Attendee[]; iAmDriver: boolean };
  meId: string;
}) {
  const others = info.passengers.filter((p) => p.id !== meId);
  return (
    <div className="mt-1 space-y-2 text-sm text-brand-700">
      {info.iAmDriver ? (
        <p className="font-medium">You&apos;re driving.</p>
      ) : (
        <p>
          Riding with{" "}
          {info.driver ? (
            <span className="font-medium">
              {info.driver.name} <PhoneLink phone={info.driver.phone} />
            </span>
          ) : (
            <span className="font-medium">a driver (TBD)</span>
          )}
        </p>
      )}

      {direction === "to_trip" && info.driver?.departure_time && (
        <p className="text-brand-600">Preferred departure: {info.driver.departure_time}</p>
      )}
      {info.driver?.departure_location && (
        <p className="text-brand-600">
          Departure/return location: {info.driver.departure_location}
        </p>
      )}

      {others.length > 0 ? (
        <div>
          <p className="font-medium">Passengers</p>
          <ul className="mt-0.5 space-y-0.5">
            {others.map((p) => (
              <li key={p.id}>
                {p.name} <PhoneLink phone={p.phone} />
              </li>
            ))}
          </ul>
        </div>
      ) : info.iAmDriver ? (
        <p className="text-brand-500">No passengers assigned yet.</p>
      ) : null}
    </div>
  );
}

// Clickable phone number — tap to call or text.
function PhoneLink({ phone }: { phone: string }) {
  return (
    <a href={`tel:${normalizePhone(phone)}`} className="text-brand-600 underline">
      {formatPhone(phone)}
    </a>
  );
}
