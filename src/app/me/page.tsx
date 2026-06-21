import Link from "next/link";
import { requireAttendee } from "@/lib/attendee";
import {
  getAttendees,
  getCabins,
  getFishingGroups,
  getRides,
  getRidePassengers,
} from "@/lib/data";
import { PAYMENT, SESSION_LABELS } from "@/lib/config";
import { formatPhone } from "@/lib/utils";
import { signOutAttendee } from "@/app/me/actions";
import MyInfoForm from "@/components/MyInfoForm";
import type { Attendee, RideDirection } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Trip · Men's Fishing Trip" };

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

  // Rides — for each direction, figure out the car I'm in
  function rideInfo(direction: RideDirection) {
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-800">My Trip</h1>
          <p className="text-sm text-brand-500">Welcome, {me.name.split(" ")[0]}!</p>
        </div>
        <form action={signOutAttendee}>
          <button className="btn-secondary text-sm">Log out</button>
        </form>
      </div>

      {me.role === "admin" && (
        <Link href="/admin" className="card flex items-center justify-between bg-olive-50 ring-olive-200 hover:bg-olive-100">
          <span className="font-semibold text-olive-800">You&apos;re an organizer</span>
          <span className="text-sm font-medium text-olive-700">Open dashboard →</span>
        </Link>
      )}

      {/* Payment */}
      {me.paid ? (
        <div className="card bg-brand-50">
          <div>
            <p className="font-semibold text-brand-800">You&apos;re paid up — thank you!</p>
            <p className="text-sm text-brand-600">${PAYMENT.amount} received.</p>
          </div>
        </div>
      ) : (
        <div className="card border-l-4 border-amber-400">
          <p className="font-semibold text-brand-800">Trip cost: ${PAYMENT.amount} (not yet received)</p>
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
              {me.is_cabin_host && (
                <span className="badge mt-1 bg-olive-600 text-white">You&apos;re a cabin host</span>
              )}
              {hosts.length > 0 && !me.is_cabin_host && (
                <p className="mt-1 text-sm text-brand-600">
                  Host: {hosts.map((h) => h.name).join(", ")}
                </p>
              )}
              {cabinmates.length > 0 && (
                <p className="mt-2 text-sm text-brand-600">
                  <span className="font-medium text-brand-700">Cabinmates:</span>{" "}
                  {cabinmates.map((a) => a.name).join(", ")}
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-sm text-brand-400">Not assigned yet — check back soon.</p>
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
                Group: <span className="font-medium">{group.name}</span>
                {group.guide_name ? ` · Guide: ${group.guide_name}` : ""}
              </p>
              {groupmates.length > 0 && (
                <p className="mt-2 text-sm text-brand-600">
                  <span className="font-medium text-brand-700">With:</span>{" "}
                  {groupmates.map((a) => a.name).join(", ")}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rides */}
      <div className="card">
        <h2 className="font-bold text-brand-800">Your rides</h2>
        <div className="mt-2 space-y-4">
          <RideBlock title="To Broken Bow" info={rideInfo("to_trip")} meId={me.id} />
          <RideBlock title="Coming home" info={rideInfo("from_trip")} meId={me.id} />
        </div>
      </div>

      {/* Editable details */}
      <MyInfoForm attendee={me} />
    </div>
  );
}

function RideBlock({
  title,
  info,
  meId,
}: {
  title: string;
  info: {
    ride: { depart_time: string | null; arrive_time: string | null; notes: string | null };
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
        <div className="mt-1 space-y-1 text-sm text-brand-700">
          {info.iAmDriver ? (
            <p>
              <span className="font-medium">You&apos;re driving.</span>
              {info.passengers.filter((p) => p.id !== meId).length > 0 ? (
                <>
                  {" "}
                  Passengers:{" "}
                  {info.passengers
                    .filter((p) => p.id !== meId)
                    .map((p) => `${p.name} (${formatPhone(p.phone)})`)
                    .join(", ")}
                </>
              ) : (
                " No passengers assigned yet."
              )}
            </p>
          ) : (
            <p>
              Riding with{" "}
              <span className="font-medium">
                {info.driver ? `${info.driver.name} (${formatPhone(info.driver.phone)})` : "a driver (TBD)"}
              </span>
            </p>
          )}
          {(info.ride.depart_time || info.ride.arrive_time) && (
            <p className="text-brand-600">
              {info.ride.depart_time ? `Leaves ${info.ride.depart_time}` : ""}
              {info.ride.depart_time && info.ride.arrive_time ? " · " : ""}
              {info.ride.arrive_time ? `Arrives ${info.ride.arrive_time}` : ""}
            </p>
          )}
          {info.ride.notes && <p className="text-brand-500">{info.ride.notes}</p>}
        </div>
      )}
    </div>
  );
}
