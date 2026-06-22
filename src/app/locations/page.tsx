import { getLocations } from "@/lib/data";
import type { LocationItem } from "@/lib/types";
import MapLink from "@/components/MapLink";
import { shortenPlace } from "@/lib/utils";

export const metadata = { title: "Locations · Men's Fishing Trip" };
export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const locations = await getLocations();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Important Locations</h1>
        <p className="mt-1 text-brand-600">
          Cabins, dinner spots, and the river.
        </p>
      </div>

      {locations.length === 0 ? (
        <div className="card text-brand-600">Locations will be posted here soon.</div>
      ) : (
        <div className="space-y-3">
          {locations.map((loc) => (
            <LocationCard key={loc.id} loc={loc} />
          ))}
        </div>
      )}
    </div>
  );
}

function LocationCard({ loc }: { loc: LocationItem }) {
  // Query uses the full name + address so the maps app lands on the right spot;
  // the display name is shortened.
  const place = [loc.name, loc.address].filter(Boolean).join(", ");

  return (
    <div className="card">
      <h3 className="font-semibold text-brand-800">{shortenPlace(loc.name)}</h3>
      {loc.address && (
        <p className="mt-2 text-sm text-brand-600">{shortenPlace(loc.address)}</p>
      )}
      <MapLink place={place} className="btn-secondary mt-3">
        Get directions
      </MapLink>
    </div>
  );
}
