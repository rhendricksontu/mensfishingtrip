import type { Attendee, Ride } from "@/lib/types";

interface RidePassenger {
  ride_id: string;
  attendee_id: string;
}

export interface VehicleGroup {
  label: string;
  people: Attendee[];
}

// Group `people` by who they rode down with (To Broken Bow), so ride-mates can
// be handled together. People without a valid ride fall into `noGroup`.
export function groupByVehicle(
  people: Attendee[],
  attendees: Attendee[],
  rides: Ride[],
  ridePassengers: RidePassenger[]
): { groups: VehicleGroup[]; noGroup: Attendee[] } {
  const byId = new Map(attendees.map((a) => [a.id, a]));
  const targetIds = new Set(people.map((a) => a.id));
  const groups: VehicleGroup[] = [];
  const placed = new Set<string>();

  const toRides = rides.filter(
    (r) => r.direction === "to_trip" && r.driver_id && byId.get(r.driver_id)?.willing_to_drive
  );
  for (const ride of toRides) {
    const driver = ride.driver_id ? byId.get(ride.driver_id) : null;
    if (!driver) continue;
    const riders = [
      driver,
      ...ridePassengers
        .filter((p) => p.ride_id === ride.id)
        .map((p) => byId.get(p.attendee_id))
        .filter((a): a is Attendee => Boolean(a)),
    ];
    const members = riders.filter((m) => targetIds.has(m.id) && !placed.has(m.id));
    if (members.length > 0) {
      members.sort((a, b) => a.name.localeCompare(b.name));
      groups.push({ label: `${driver.name}'s Vehicle`, people: members });
      members.forEach((m) => placed.add(m.id));
    }
  }

  const noGroup = people
    .filter((a) => !placed.has(a.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { groups, noGroup };
}
