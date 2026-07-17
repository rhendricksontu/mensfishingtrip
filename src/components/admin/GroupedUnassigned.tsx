import PhoneLink from "@/components/PhoneLink";
import type { Attendee } from "@/lib/types";
import type { VehicleGroup } from "@/lib/vehicle-groups";

// Amber box listing people who still need an assignment, grouped by the vehicle
// they rode down in (with a "No Group Assigned" bucket for those without one).
export default function GroupedUnassigned({
  title,
  groups,
  noGroup,
}: {
  title: string;
  groups: VehicleGroup[];
  noGroup: Attendee[];
}) {
  const Person = ({ a }: { a: Attendee }) => (
    <li>
      <span className="font-medium text-brand-800">{a.name}</span>
      <PhoneLink phone={a.phone} className="ml-2 text-xs text-brand-400 underline" />
    </li>
  );

  return (
    <div className="card border border-dashed border-amber-200 bg-amber-50/40 text-sm">
      <p className="font-semibold text-amber-800">{title}</p>
      <div className="mt-2 space-y-3">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              {g.label}
            </p>
            <ul className="mt-0.5 space-y-1">
              {g.people.map((a) => (
                <Person key={a.id} a={a} />
              ))}
            </ul>
          </div>
        ))}
        {noGroup.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              No Group Assigned
            </p>
            <ul className="mt-0.5 space-y-1">
              {noGroup.map((a) => (
                <Person key={a.id} a={a} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
