import { getLocations, getCabins } from "@/lib/data";
import type { LocationItem, Cabin } from "@/lib/types";
import MapLink from "@/components/MapLink";
import { shortenPlace, addressLines, addressOneLine } from "@/lib/utils";

export const metadata = { title: "Locations · Men's Fishing Trip" };
export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const [locations, cabins] = await Promise.all([getLocations(), getCabins()]);

  const empty = locations.length === 0 && cabins.length === 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Important Locations</h1>
        <p className="mt-1 text-brand-600">
          Cabins, dinner spots, and the river.
        </p>
      </div>

      {empty ? (
        <div className="card text-brand-600">Locations will be posted here soon.</div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-brand-700">Around Broken Bow</h2>
          {cabins.map((c) => (
            <CabinCard key={c.id} cabin={c} />
          ))}
          {locations.map((loc) => (
            <LocationCard key={loc.id} loc={loc} />
          ))}
        </div>
      )}
    </div>
  );
}

function CabinCard({ cabin }: { cabin: Cabin }) {
  const lines = addressLines(cabin);
  const query = addressOneLine(cabin);

  return (
    <div className="card">
      <h3 className="font-semibold text-brand-800">{cabin.name}</h3>
      {lines.length > 0 && (
        <div className="mt-2 text-sm text-brand-600">
          {lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
      {query && (
        <MapLink place={query} className="btn-secondary mt-3">
          Get directions
        </MapLink>
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
