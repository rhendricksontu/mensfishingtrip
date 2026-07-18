import type { Attendee, Ride } from "@/lib/types";

interface RidePassenger {
  ride_id: string;
  attendee_id: string;
}

export interface VehicleGroup {
  label: string;
  people: Attendee[];
}

// Group `people` by the vehicle they travel down in (To Broken Bow), so
// ride-mates can be handled together. A driver is always their own vehicle —
// even with no passengers assigned yet (no ride row) — so drivers never fall
// into `noGroup`. Passengers group under their assigned driver.
export function groupByVehicle(
  people: Attendee[],
  attendees: Attendee[],
  rides: Ride[],
  ridePassengers: RidePassenger[]
): { groups: VehicleGroup[]; noGroup: Attendee[] } {
  const byId = new Map(attendees.map((a) => [a.id, a]));
  // Anyone providing their own car: offered seats, or driving themselves.
  const isDriver = (a: Attendee) => a.willing_to_drive || a.ride_preference === "driving";

  // Map each attendee to the driver whose vehicle they're in.
  const driverOf = new Map<string, string>();
  // Passengers ride with the driver of their to_trip ride (valid drivers only).
  const toRideById = new Map(
    rides.filter((r) => r.direction === "to_trip" && r.driver_id).map((r) => [r.id, r])
  );
  for (const p of ridePassengers) {
    const ride = toRideById.get(p.ride_id);
    if (!ride?.driver_id) continue;
    if (byId.get(ride.driver_id)?.willing_to_drive) driverOf.set(p.attendee_id, ride.driver_id);
  }
  // A driver is their own vehicle (and can't be someone else's passenger).
  for (const a of attendees) {
    if (isDriver(a)) driverOf.set(a.id, a.id);
  }

  const byDriver = new Map<string, Attendee[]>();
  const noGroup: Attendee[] = [];
  for (const person of people) {
    const driverId = driverOf.get(person.id);
    if (!driverId) {
      noGroup.push(person);
      continue;
    }
    if (!byDriver.has(driverId)) byDriver.set(driverId, []);
    byDriver.get(driverId)!.push(person);
  }

  const groups = Array.from(byDriver.entries())
    .map(([driverId, members]) => ({
      label: `${byId.get(driverId)?.name ?? "Unknown"}'s Vehicle`,
      people: members.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  noGroup.sort((a, b) => a.name.localeCompare(b.name));
  return { groups, noGroup };
}
