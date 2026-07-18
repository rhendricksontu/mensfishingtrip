import { requireAttendee } from "@/lib/attendee";
import {
  getAttendees,
  getCabins,
  getFishingGroups,
  getRides,
  getRidePassengers,
  getSignups,
  getSignupLeaders,
  getVisibility,
  getCoffeeOrdersForAttendee,
} from "@/lib/data";
import { PAYMENT, SESSION_LABELS } from "@/lib/config";
import { addressLines, addressOneLine, shortenPlace } from "@/lib/utils";
import MyInfoForm from "@/components/MyInfoForm";
import CoffeeReadyBanner from "@/components/CoffeeReadyBanner";
import MapLink from "@/components/MapLink";
import PhoneLink from "@/components/PhoneLink";
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
  const [attendees, cabins, groups, rides, ridePassengers, signups, signupLeaders, visibility, coffee] =
    await Promise.all([
      getAttendees(),
      getCabins(),
      getFishingGroups(),
      getRides(),
      getRidePassengers(),
      getSignups(),
      getSignupLeaders(),
      getVisibility(),
      getCoffeeOrdersForAttendee(me.id),
    ]);

  // Coffee orders the organizer has marked ready for pickup.
  const readyCoffee = coffee.filter((o) => o.status === "ready");

  const byId = new Map(attendees.map((a) => [a.id, a]));

  // Volunteering — each role+day instance this member is part of, either as the
  // leader or as an assigned volunteer. Mirrors the fishing card: the leader is
  // shown like a guide and the volunteers like the anglers in the group.
  const myVolunteerKeys = new Set<string>();
  for (const s of signups) {
    if (s.attendee_id === me.id) myVolunteerKeys.add(`${s.role}:${s.trip_day}`);
  }
  for (const l of signupLeaders) {
    if (l.attendee_id === me.id) myVolunteerKeys.add(`${l.role}:${l.trip_day}`);
  }
  const myVolunteering = Array.from(myVolunteerKeys)
    .map((k) => {
      const [role, trip_day] = k.split(":") as [SignupRole, string];
      const leaderRow = signupLeaders.find((l) => l.role === role && l.trip_day === trip_day);
      const leader = leaderRow?.attendee_id ? byId.get(leaderRow.attendee_id) ?? null : null;
      const volunteers = signups
        .filter((s) => s.role === role && s.trip_day === trip_day)
        .map((s) => {
          const a = s.attendee_id ? byId.get(s.attendee_id) : null;
          return {
            id: s.id,
            attendeeId: s.attendee_id,
            name: a?.name ?? s.name,
            phone: a?.phone ?? "",
          };
        })
        .sort((x, y) => x.name.localeCompare(y.name));
      return { role, trip_day, leader, volunteers };
    })
    .sort((a, b) => a.trip_day.localeCompare(b.trip_day) || a.role.localeCompare(b.role));

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

  // One car both ways — the Rides tab manages the single "to_trip" ride, so
  // that's the sole source of truth for a member's ride (no from_trip fallback,
  // which could otherwise surface a stale assignment). Any driver (offering
  // seats or driving themselves) with no ride row still sees their own card.
  const iAmDriver = me.willing_to_drive || me.ride_preference === "driving";
  const myRide =
    findRide("to_trip") ??
    (iAmDriver ? { driver: me, passengers: [] as Attendee[] } : null);

  // Each card needs BOTH an assignment AND the organizer's go-ahead to show.
  const showCabin = visibility.show_cabins && Boolean(cabin);
  const showFishing =
    visibility.show_fishing && (guidingGroups.length > 0 || Boolean(group));
  const showRide = visibility.show_rides && Boolean(myRide?.driver);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">My Fishing Trip</h1>
        <p className="text-sm text-brand-500">Welcome, {me.name.split(" ")[0]}!</p>
      </div>

      {/* Coffee ready for pickup — sits right below the welcome. */}
      <CoffeeReadyBanner orders={readyCoffee} />

      {/* Payment — the paid state is shown as a pill on the Your RSVP card. */}
      {!me.paid && (
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

      {/* Assignments — each card needs an assignment AND organizer visibility. */}
      {(showCabin || showFishing) && (
        <div className="space-y-4">
          {/* Cabin */}
          {showCabin && cabin && (
            <div className="space-y-2">
              <h2 className="font-bold text-brand-800">Cabin</h2>
              <CabinView cabin={cabin} occupants={cabinOccupants} meId={me.id} />
            </div>
          )}

          {/* Fishing */}
          {showFishing && (
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
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Volunteering — leader shown like a guide, volunteers like the anglers */}
      {visibility.show_volunteers && myVolunteering.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-bold text-brand-800">Volunteering</h2>
          <div className="space-y-3">
            {myVolunteering.map((v) => (
              <VolunteerView
                key={`${v.role}:${v.trip_day}`}
                roleLabel={SIGNUP_ROLE_LABELS[v.role]}
                dayLabel={
                  v.trip_day === "both"
                    ? "Saturday & Sunday"
                    : v.trip_day.charAt(0).toUpperCase() + v.trip_day.slice(1)
                }
                leader={v.leader}
                volunteers={v.volunteers}
                meId={me.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Your Ride — hidden until the member is in a car and the organizer reveals it */}
      {showRide && myRide?.driver && (
        <div>
          <h2 className="font-bold text-brand-800">Your Ride</h2>
          <div className="mt-2">
            <RideCard info={myRide} meId={me.id} />
          </div>
        </div>
      )}

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
// Read-only ride card — one car for both directions (To Broken Bow assumed).
function RideCard({
  info,
  meId,
}: {
  info: { driver: Attendee | null; passengers: Attendee[] };
  meId: string;
}) {
  const driver = info.driver;
  if (!driver) return null;
  const takingPassengers = driver.willing_to_drive;
  const seatsLeft = driver.seat_capacity - info.passengers.length;
  const over = seatsLeft < 0;

  return (
    <div className="card space-y-3">
      <div>
        <span className="mb-1 inline-block rounded-full bg-olive-600 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-cream">
          Driver
        </span>
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className="font-bold text-brand-800">
            {driver.name}
            {driver.id === meId && " (You)"}
          </h3>
          <PhoneLink phone={driver.phone} />
        </div>
        {takingPassengers && (
          <span className={`text-sm ${over ? "font-semibold text-red-600" : "text-brand-500"}`}>
            {info.passengers.length}/{driver.seat_capacity} Seats
          </span>
        )}
      </div>

      {driver.departure_time && (
        <div className="space-y-0.5 text-xs text-brand-500">
          <p>Preferred Departure: {driver.departure_time}</p>
        </div>
      )}

      {info.passengers.length > 0 && (
        <ul className="divide-y divide-brand-50">
          {info.passengers.map((p) => (
            <li key={p.id} className="py-2 text-sm">
              <span className="font-medium text-brand-800">
                {p.name}
                {p.id === meId && " (You)"}
              </span>{" "}
              <PhoneLink phone={p.phone} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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

// Read-only volunteering card, mirroring the fishing guide card: the role's
// leader is shown like a guide, and the assigned volunteers like the anglers.
function VolunteerView({
  roleLabel,
  dayLabel,
  leader,
  volunteers,
  meId,
}: {
  roleLabel: string;
  dayLabel: string;
  leader: Attendee | null;
  volunteers: { id: string; attendeeId: string | null; name: string; phone: string }[];
  meId: string;
}) {
  return (
    <div className="card space-y-3">
      <div>
        {leader ? (
          <>
            <span className="mb-1 inline-block rounded-full bg-olive-600 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-cream">
              Leader
            </span>
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="font-bold text-brand-800">
                {leader.name}
                {leader.id === meId && " (You)"}
              </h3>
              <PhoneLink phone={leader.phone} />
            </div>
          </>
        ) : (
          <span className="mb-1 inline-block rounded-full bg-amber-300 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
            No Leader Yet
          </span>
        )}
        <p className="text-sm text-brand-600">
          {roleLabel} · {dayLabel}
        </p>
      </div>

      {volunteers.length > 0 && (
        <ul className="divide-y divide-brand-50">
          {volunteers.map((v) => (
            <li key={v.id} className="py-2 text-sm">
              <span className="font-medium text-brand-800">
                {v.name}
                {v.attendeeId === meId && " (You)"}
              </span>{" "}
              {v.phone && <PhoneLink phone={v.phone} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
