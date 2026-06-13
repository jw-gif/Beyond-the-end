export type Tier = 'family' | 'friends' | 'public'

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'

export interface Profile {
  id: string
  name: string
  email: string
  tier: Tier
  member_since: string
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  avatar_url: string | null
}

export interface Booking {
  id: string
  profile_id: string
  start_date: string
  end_date: string
  guest_adults: number
  guest_children: number
  host_note: string | null
  status: BookingStatus
  tier_at_booking: Tier
  title: string
  created_at: string
}

export interface CoopItem {
  id: string
  label: string
  subtitle: string | null
  claimed_by: string | null
  created_at: string
}

export interface GuestNote {
  id: string
  author_name: string
  title: string
  body: string
  note_date: string
}

export interface InventoryItem {
  id: string
  label: string
  detail: string
  icon: string
}

export interface Memoir {
  id: string
  profile_id: string
  title: string
  body: string
  memoir_date: string
  photo_count: number
}

export interface AdminBlock {
  id: string
  start_date: string
  end_date: string
  reason: string
}

export interface Rate {
  id: string
  tier: Tier
  nightly_rate: number
}
