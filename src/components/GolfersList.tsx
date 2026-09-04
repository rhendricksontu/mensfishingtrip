import PhoneLink from "@/components/PhoneLink";
import type { Attendee } from "@/lib/types";

// The people who chose "Golfing" as an activity — shown to the golf leader and
// organizers so they know who's in.
export default function GolfersList({ golfers }: { golfers: Attendee[] }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-brand-800">Interested in Golfing ({golfers.length})</h3>
      {golfers.length === 0 ? (
        <p className="mt-1 text-sm text-brand-400">No one has chosen Golfing yet.</p>
      ) : (
        <ul className="mt-2 space-y-1.5 text-sm">
          {golfers.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-2">
              <span className="font-medium text-brand-800">{g.name}</span>
              {g.phone && (
                <PhoneLink phone={g.phone} className="text-xs text-brand-400 underline" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
