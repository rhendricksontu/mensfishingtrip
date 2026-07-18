import { NextResponse } from "next/server";
import { getDataVersion } from "@/lib/data";

export const dynamic = "force-dynamic";

// Tiny endpoint the client polls to detect changes without re-fetching pages.
// Returns just the current data version. Not sensitive (a monotonic counter).
export async function GET() {
  const version = await getDataVersion();
  return NextResponse.json({ version }, { headers: { "Cache-Control": "no-store" } });
}
