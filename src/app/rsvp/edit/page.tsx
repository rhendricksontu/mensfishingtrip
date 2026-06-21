import EditRsvp from "@/components/EditRsvp";

export const metadata = { title: "Edit RSVP · Men's Fishing Trip" };

export default function EditRsvpPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Edit your RSVP</h1>
        <p className="mt-1 text-brand-600">
          Enter the name and phone number you used to RSVP and we&apos;ll pull up your info.
        </p>
      </div>
      <EditRsvp />
    </div>
  );
}
