import Link from "next/link";
import { redirect } from "next/navigation";
import AttendeeLoginForm from "@/components/AttendeeLoginForm";
import { getCurrentAttendee } from "@/lib/attendee";

export const metadata = { title: "Log In · Men's Fishing Trip" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const me = await getCurrentAttendee();
  if (me) redirect("/me");

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Log In</h1>
        <p className="mt-1 text-brand-600">
          Use the cell phone and password you set when you RSVP&apos;d.
        </p>
      </div>
      <AttendeeLoginForm />
      <p className="text-center text-sm text-brand-500">
        <Link href="/reset" className="font-semibold text-brand-600 underline">
          Forgot your password?
        </Link>
      </p>
    </div>
  );
}
