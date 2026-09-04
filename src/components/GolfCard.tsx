import MapLink from "@/components/MapLink";
import { to12Hour } from "@/lib/utils";
import type { Golf } from "@/lib/types";

// Read-only golf details shown on My Trip to attendees who chose Golfing.
export default function GolfCard({ golf }: { golf: Golf }) {
  const placeLabel = [golf.location_name, golf.location].filter(Boolean).join(" · ");
  const hasAddress = Boolean(golf.location && /\d/.test(golf.location));

  return (
    <div className="card">
      <h3 className="font-bold text-brand-800">{golf.title || "Golf"}</h3>
      {golf.start_time && (
        <p className="mt-0.5 text-sm font-medium text-brand-600">{to12Hour(golf.start_time)}</p>
      )}
      {placeLabel &&
        (hasAddress ? (
          <MapLink
            place={golf.location!}
            className="mt-1 inline-block text-sm font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
          >
            {placeLabel}
          </MapLink>
        ) : (
          <p className="mt-1 text-sm font-medium text-brand-500">{placeLabel}</p>
        ))}
      {golf.notes && (
        <p className="mt-2 whitespace-pre-line text-sm text-brand-600">{golf.notes}</p>
      )}
    </div>
  );
}
