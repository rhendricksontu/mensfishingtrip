import { getSignups, getFishingGroups } from "@/lib/data";
import SignupBoard from "@/components/SignupBoard";

export const metadata = { title: "Signups · Men's Fishing Trip" };
export const dynamic = "force-dynamic";

export default async function SignupsPage() {
  const [signups, groups] = await Promise.all([getSignups(), getFishingGroups()]);
  // Each fishing group has a guide who needs a sack lunch.
  const guideCount = groups.length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Breakfast, Coffee & Guide Lunches</h1>
        <p className="mt-1 text-brand-600">
          A weekend runs on coffee, a hot breakfast, and well-fed guides. Grab a slot below.
        </p>
      </div>
      <SignupBoard signups={signups} guideCount={guideCount} />
    </div>
  );
}
