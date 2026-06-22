import { getSignups } from "@/lib/data";
import SignupBoard from "@/components/SignupBoard";

export const metadata = { title: "Signups · Men's Fishing Trip" };
export const dynamic = "force-dynamic";

export default async function SignupsPage() {
  const signups = await getSignups();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Breakfast, Coffee & Guide Lunches</h1>
        <p className="mt-1 text-brand-600">
          A weekend runs on coffee, a hot breakfast, and well-fed guides. Grab a slot below.
        </p>
      </div>
      <SignupBoard signups={signups} />
    </div>
  );
}
