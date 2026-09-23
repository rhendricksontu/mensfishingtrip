import ExpandableNote from "@/components/ExpandableNote";

// Expandable "View Check-in Details for <Cabin>" toggle. Renders nothing when a
// cabin has no check-in details.
export default function CabinCheckin({
  name,
  details,
}: {
  name: string;
  details: string | null;
}) {
  return (
    <ExpandableNote label={`Check-in Details for ${name}`} details={details} className="mt-2" />
  );
}
