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
  // Pre-filled Venmo deep link (works on mobile if the app is installed).
  venmoUrl:
    "https://venmo.com/yomikeywhitey?txn=pay&amount=90&note=Men%27s%20Fishing%20Trip%202026",
  description: "Covers cabins, guides, and meals for the weekend.",
};

export const DEPARTURE_TIME_OPTIONS = [
  "Early Friday Morning (Before 8am)",
  "Friday Morning (8am-12pm)",
  "Early Friday Afternoon (12pm-3pm)",
  "Friday Afternoon (After 3pm)",
];

export const DEPARTURE_LOCATION_OPTIONS = [
  "My House",
  "Someone Else's House",
  "Crossings - OKC",
  "Crossings - Edmond",
  "Other",
  "No Preference",
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

export const RIDE_PREF_LABELS: Record<string, string> = {
  driving: "Driver",
  riding: "Passenger",
  either: "Either", // legacy fallback for older RSVPs
};
