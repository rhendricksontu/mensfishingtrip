// ----------------------------------------------------------------------------
// Trip-wide configuration. Change these values to update the whole site.
// ----------------------------------------------------------------------------

export const TRIP = {
  name: "2026 Men's Fishing Trip",
  shortName: "Fishing Trip",
  edition: "11th Annual",
  location: "Broken Bow, Oklahoma",
  startDate: "2026-09-25", // Friday
  endDate: "2026-09-27", // Sunday
  datesLabel: "Friday, September 25, 2026 – Sunday, September 27, 2026",
};

export const PAYMENT = {
  amount: 90,
  venmoHandle: "@yomikeywhitey",
  // Venmo web link (reliably opens the app on mobile). The memo is camel case
  // with no spaces, so Venmo doesn't render spaces as "+".
  venmoUrl:
    "https://venmo.com/yomikeywhitey?txn=pay&amount=90&note=MensFishingTrip2026",
  description: "Covers cabins, guides, and meals for the weekend.",
};

export const DEPARTURE_TIME_OPTIONS = [
  "Early Friday Morning (Before 8am)",
  "Friday Morning (8am-12pm)",
  "Early Friday Afternoon (12pm-3pm)",
  "Friday Afternoon (After 3pm)",
  "Other",
];

export const TRIP_DAYS = ["friday", "saturday", "sunday"] as const;
export type TripDay = (typeof TRIP_DAYS)[number];

export const DAY_LABELS: Record<string, string> = {
  friday: "Friday, Sep 25",
  saturday: "Saturday, Sep 26",
  sunday: "Sunday, Sep 27",
};

export const SESSION_LABELS: Record<string, string> = {
  saturday_morning: "Saturday Morning",
  saturday_afternoon: "Saturday Afternoon",
};

// Optional activity interests collected on the RSVP form. "Other" is handled
// separately with a free-text field (`activity_other`).
export const ACTIVITY_OPTIONS = [
  { value: "biking", label: "Biking" },
  { value: "golfing", label: "Golfing" },
  { value: "hiking", label: "Hiking" },
];

// Events whose location a cabin can be designated for, on the Cabins tab.
// The `key` matches agenda_items.event_key.
export const CABIN_EVENT_OPTIONS = [
  { key: "saturday_breakfast", label: "Saturday Breakfast" },
  { key: "sunday_breakfast", label: "Sunday Breakfast" },
  { key: "friday_service", label: "Friday Night Service" },
  { key: "saturday_service", label: "Saturday Night Service" },
];

export const RIDE_PREF_LABELS: Record<string, string> = {
  driving: "Driver",
  riding: "Passenger",
  either: "Either", // legacy fallback for older RSVPs
};

// ---- Coffee ordering -------------------------------------------------------

export const COFFEE_DRINKS = [
  "Americano",
  "Espresso - Single Shot",
  "Espresso - Double Shot",
  "Iced Coffee",
  "Latte",
  "Mocha",
  "Sunrise",
] as const;

// Build "5:45 AM"-style labels in 15-minute steps between two minute-of-day
// bounds (inclusive).
function pickupTimes(startMin: number, endMin: number): string[] {
  const out: string[] = [];
  for (let m = startMin; m <= endMin; m += 15) {
    let h = Math.floor(m / 60);
    const min = m % 60;
    const mer = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    out.push(`${h}:${String(min).padStart(2, "0")} ${mer}`);
  }
  return out;
}

// Pickup windows (Central), 15-minute increments.
export const COFFEE_PICKUP_TIMES: Record<"saturday" | "sunday", string[]> = {
  saturday: pickupTimes(5 * 60 + 45, 9 * 60), // 5:45 AM – 9:00 AM
  sunday: pickupTimes(5 * 60 + 45, 7 * 60), // 5:45 AM – 7:00 AM
};

export const COFFEE_DAYS = [
  { day: "saturday", label: "Saturday" },
  { day: "sunday", label: "Sunday" },
] as const;
