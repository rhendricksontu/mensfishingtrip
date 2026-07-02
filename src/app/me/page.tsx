import { requireAttendee } from "@/lib/attendee";
import {
  getAttendees,
  getCabins,
  getFishingGroups,
  getRides,
  getRidePassengers,
  getSignups,
} from "@/lib/data";
import { PAYMENT, SESSION_LABELS } from "@/lib/config";
import { addressLines, addressOneLine, shortenPlace } from "@/lib/utils";
import MyInfoForm from "@/components/MyInfoForm";
import MapLink from "@/components/MapLink";
import PhoneLink from "@/components/PhoneLink";
import TripRides from "@/components/trip/TripRides";
import type {
  Attendee,
  Cabin,
  FishingGroup,
  FishingSession,
  RideDirection,
  SignupRole,
} from "@/lib/types";

const SIGNUP_ROLE_LABELS: Record<SignupRole, string> = {
  breakfast_cook: "Breakfast Cook",
  coffee_maker: "Coffee Maker",
  guide_lunch: "Guide Lunch Maker",
};

export const dynamic = "force-dynamic";
export const metadata = { title: "My Fishing Trip · Men's Fishing Trip" };

export default async function MyTripPage() {
  const me = await requireAttendee();
  const [attendees, cabins, groups, rides, ridePassengers, signups] = await Promise.all([
    getAttendees(),
    getCabins(),
    getFishingGroups(),
    getRides(),
    getRidePassengers(),
    getSignups(),
  ]);

  // This member's volunteer signups (breakfast/coffee/guide lunch).
  const mySignups = signups
    .filter((s) => s.attendee_id === me.id)
    .sort((a, b) => a.trip_day.localeCompare(b.trip_day));

  const byId = new Map(attendees.map((a) => [a.id, a]));

  // Cabin (all occupants, for the read-only card)
  const cabin = cabins.find((c) => c.id === me.cabin_id) || null;
  const cabinOccupants = cabin
    ? attendees.filter((a) => a.cabin_id === cabin.id)
    : [];

  // Fishing (all anglers in my group)
  const group = groups.find((g) => g.id === me.fishing_group_id) || null;
  const groupAnglers = group
    ? attendees.filter((a) => a.fishing_group_id === group.id)
    : [];

  // Groups this member is guiding (if any), with their anglers.
  const guidingGroups = groups
    .filter((g) => g.guide_attendee_id === me.id)
    .map((g) => ({
      group: g,
      anglers: attendees.filter((a) => a.fishing_group_id === g.id),
    }));

  // The car I'm in for a single direction (explicit only). Only rides whose
  // driver is actually a willing driver count, so stale rows (e.g. a former
  // driver who switched to passenger) don't show a bogus assignment.
  function findRide(direction: RideDirection) {
    const dirRides = rides.filter(
      (r) =>
        r.direction === direction &&
        r.driver_id &&
        byId.get(r.driver_id)?.willing_to_drive
    );
    const asDriver = me.willing_to_drive
      ? dirRides.find((r) => r.driver_id === me.id)
      : undefined;
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
          <a
            href={PAYMENT.venmoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-3"
          >
            Pay ${PAYMENT.amount} on Venmo
          </a>
          <p className="mt-2 text-xs text-brand-400">Already paid? It&apos;ll update once an organizer confirms it.</p>
        </div>
      )}

      {/* Volunteer signups */}
      {mySignups.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-brand-800">Volunteer Signups</h2>
          <ul className="mt-2 divide-y divide-brand-50">
            {mySignups.map((s) => (
              <li key={s.id} className="py-2 text-sm">
                <span className="font-medium text-brand-800">
                  {SIGNUP_ROLE_LABELS[s.role]}
                </span>
                <span className="ml-2 text-xs text-brand-400">
                  {s.trip_day.charAt(0).toUpperCase() + s.trip_day.slice(1)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Assignments */}
      <div className="space-y-4">
        {/* Cabin */}
        <div className="space-y-2">
          <h2 className="font-bold text-brand-800">Cabin</h2>
          {cabin ? (
            <CabinView cabin={cabin} occupants={cabinOccupants} meId={me.id} />
          ) : (
            <div className="card text-sm text-brand-400">Not assigned yet. Check back soon.</div>
          )}
        </div>

        {/* Fishing */}
        <div className="space-y-2">
          <h2 className="font-bold text-brand-800">Fishing</h2>
          {guidingGroups.length > 0 ? (
            <GuidingView groups={guidingGroups} meId={me.id} />
          ) : group ? (
            <GuideView
              group={group}
              anglers={groupAnglers}
              session={me.assigned_session}
              meId={me.id}
            />
          ) : (
            <div className="card text-sm text-brand-400">Session not assigned yet.</div>
          )}
        </div>
      </div>

      {/* Rides */}
      <div>
        <h2 className="font-bold text-brand-800">Your Rides</h2>
        <div className="mt-2">
          <TripRides
            toInfo={rideInfo("to_trip")}
            fromInfo={rideInfo("from_trip")}
            meId={me.id}
          />
        </div>
      </div>

      {/* Editable details */}
      <MyInfoForm attendee={me} />
    </div>
  );
}

// Read-only cabin card, mirroring the organizer Cabins card.
function CabinView({
  cabin,
  occupants,
  meId,
}: {
  cabin: Cabin;
  occupants: Attendee[];
  meId: string;
}) {
  const host = occupants.find((a) => a.is_cabin_host) ?? null;
  const over = cabin.capacity > 0 && occupants.length > cabin.capacity;
  const lines = addressLines(cabin);
  const mapQuery = addressOneLine(cabin);
  const others = occupants.filter((a) => !a.is_cabin_host);
  const cap = cabin.capacity > 0 ? ` / ${cabin.capacity}` : "";

  return (
    <div className="card space-y-3">
      <div>
        <h3 className="font-bold text-brand-800">{cabin.name}</h3>
        {mapQuery && (
          <MapLink
            place={mapQuery}
            className="mt-0.5 inline-block text-sm font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
          >
            {lines.join(", ")}
          </MapLink>
        )}
      </div>

      {host ? (
        <div>
          <span className="mb-1 inline-block rounded-full bg-olive-600 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-cream">
            Cabin Host
          </span>
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="font-bold text-brand-800">
              {host.name}
              {host.id === meId && " (You)"}
            </h3>
            <PhoneLink phone={host.phone} />
          </div>
          <span className={`text-sm ${over ? "font-semibold text-red-600" : "text-brand-500"}`}>
            {occupants.length}
            {cap} Men
          </span>
        </div>
      ) : (
        <div>
          <span className="mb-1 inline-block rounded-full bg-amber-300 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
            No Host Yet
          </span>
          <p className={`text-sm ${over ? "font-semibold text-red-600" : "text-brand-500"}`}>
            {occupants.length}
            {cap} Men
          </p>
        </div>
      )}

      {others.length > 0 && (
        <ul className="divide-y divide-brand-50">
          {others.map((a) => (
            <li key={a.id} className="py-2 text-sm">
              <span className="font-medium text-brand-800">
                {a.name}
                {a.id === meId && " (You)"}
              </span>{" "}
              <PhoneLink phone={a.phone} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Read-only fishing group card, mirroring the organizer guide card.
// For a member who guides: one GuideView card per session they guide, so it
// looks identical to the non-guide fishing card (guide name + phone included).
function GuidingView({
  groups,
  meId,
}: {
  groups: { group: FishingGroup; anglers: Attendee[] }[];
  meId: string;
}) {
  return (
    <div className="space-y-3">
      {groups.map(({ group: g, anglers }) => (
        <GuideView key={g.id} group={g} anglers={anglers} session={g.session} meId={meId} />
      ))}
    </div>
  );
}

function GuideView({
  group,
  anglers,
  session,
  meId,
}: {
  group: FishingGroup;
  anglers: Attendee[];
  session: FishingSession | null;
  meId: string;
}) {
  const guideName = group.guide_name || group.name;
  const over = group.capacity > 0 && anglers.length > group.capacity;
  const cap = group.capacity > 0 ? ` / ${group.capacity}` : "";

  return (
    <div className="card space-y-3">
      <div>
        <span className="mb-1 inline-block rounded-full bg-olive-600 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-cream">
          Fishing Guide
        </span>
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className="font-bold text-brand-800">
            {guideName}
            {group.guide_attendee_id === meId && " (You)"}
          </h3>
          {group.guide_phone && <PhoneLink phone={group.guide_phone} />}
        </div>
        {session && <p className="text-sm text-brand-600">{SESSION_LABELS[session]}</p>}
      </div>

      {(group.meet_location || group.meet_time) && (
        <p className="text-sm text-brand-700">
          Meet:{" "}
          {group.meet_location && (
            <MapLink
              place={group.meet_location}
              className="font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
            >
              {group.meet_location_name || shortenPlace(group.meet_location)}
            </MapLink>
          )}
          {group.meet_location && group.meet_time && " · "}
          {group.meet_time && <span className="font-medium text-brand-800">{group.meet_time}</span>}
        </p>
      )}

      <span className={`text-sm ${over ? "font-semibold text-red-600" : "text-brand-500"}`}>
        {anglers.length}
        {cap} Anglers
      </span>

      {anglers.length > 0 && (
        <ul className="divide-y divide-brand-50">
          {anglers.map((a) => (
            <li key={a.id} className="py-2 text-sm">
              <span className="font-medium text-brand-800">
                {a.name}
                {a.id === meId && " (You)"}
              </span>{" "}
              <PhoneLink phone={a.phone} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
