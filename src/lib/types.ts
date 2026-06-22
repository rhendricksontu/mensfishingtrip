export type RidePreference = "driving" | "riding" | "either";
export type FishingSession = "saturday_morning" | "saturday_afternoon";
export type SignupRole = "breakfast_cook" | "coffee_maker" | "guide_lunch";
export type RideDirection = "to_trip" | "from_trip";

export interface Cabin {
  id: string;
  name: string;
  address: string | null; // legacy free-text fallback
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  capacity: number;
  notes: string | null;
  sort_order: number;
}

export interface FishingGroup {
  id: string;
  name: string;
  session: FishingSession;
  guide_name: string | null;
  guide_phone: string | null;
  capacity: number;
  notes: string | null;
}

export type Role = "member" | "admin";

export interface Attendee {
  id: string;
  user_id: string | null;
  role: Role;
  name: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  ride_preference: RidePreference;
  departure_time: string | null;
  departure_location: string | null;
  preferred_driver: string | null;
  willing_to_drive: boolean;
  seat_capacity: number;
  needs_ride: boolean;
  fish_with_guide: boolean;
  cabin_id: string | null;
  is_cabin_host: boolean;
  fishing_group_id: string | null;
  assigned_session: FishingSession | null;
  paid: boolean;
  paid_at: string | null;
  payment_note: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Signup {
  id: string;
  role: SignupRole;
  trip_day: string;
  quantity: number;
  attendee_id: string | null;
  name: string;
  created_at: string;
}

export interface Ride {
  id: string;
  driver_id: string | null;
  direction: RideDirection;
  depart_time: string | null;
  arrive_time: string | null;
  notes: string | null;
  created_at: string;
}

export interface AgendaItem {
  id: string;
  trip_day: string;
  start_time: string | null;
  sort_order: number;
  title: string;
  description: string | null;
  location: string | null;
}

export interface LocationItem {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  map_url: string | null;
  notes: string | null;
  sort_order: number;
}
