import { getLocations } from "@/lib/data";
import type { LocationItem } from "@/lib/types";

export const metadata = { title: "Locations · Men's Fishing Trip" };
export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const locations = await getLocations();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-pine-800">Important Locations</h1>
        <p className="mt-1 text-pine-600">
          Cabins, dinner spots, and the river. Tap an address for directions.
        </p>
      </div>

      {locations.length === 0 ? (
        <div className="card text-pine-600">Locations will be posted here soon.</div>
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
  const mapHref =
    loc.map_url ||
    (loc.address
      ? `https://maps.google.com/?q=${encodeURIComponent(loc.address)}`
      : null);

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-pine-800">{loc.name}</h3>
          {loc.category && (
            <span className="badge mt-1 bg-pine-100 text-pine-700">{loc.category}</span>
          )}
        </div>
      </div>
      {loc.notes && <p className="mt-2 text-sm text-pine-600">{loc.notes}</p>}
      {loc.address && (
        <p className="mt-2 text-sm text-pine-600">{loc.address}</p>
      )}
      {mapHref && (
        <a
          href={mapHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary mt-3"
        >
          🧭 Get directions
        </a>
      )}
    </div>
  );
}
