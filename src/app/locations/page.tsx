import { getLocations } from "@/lib/data";
import type { LocationItem } from "@/lib/types";
import MapLink from "@/components/MapLink";

export const metadata = { title: "Locations · Men's Fishing Trip" };
export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const locations = await getLocations();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Important Locations</h1>
        <p className="mt-1 text-brand-600">
          Cabins, dinner spots, and the river. Tap an address for directions.
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
  const place = loc.address || loc.name;

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-brand-800">{loc.name}</h3>
          {loc.category && (
            <span className="badge mt-1 bg-brand-100 text-brand-700">{loc.category}</span>
          )}
        </div>
      </div>
      {loc.notes && <p className="mt-2 text-sm text-brand-600">{loc.notes}</p>}
      {loc.address && (
        <p className="mt-2 text-sm text-brand-600">{loc.address}</p>
      )}
      {loc.map_url ? (
        <a href={loc.map_url} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-3">
          🧭 Get directions
        </a>
      ) : loc.address ? (
        <MapLink place={place} className="btn-secondary mt-3">
          🧭 Get directions
        </MapLink>
      ) : null}
    </div>
  );
}
