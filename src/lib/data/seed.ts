import type {
  Profile, Booking, CoopItem, GuestNote,
  InventoryItem, Memoir, AdminBlock, Rate
} from '../types'

export const profiles: Profile[] = [
  {
    id: 'profile-1',
    name: 'Julian Thorne',
    email: 'julian.t@family',
    tier: 'family',
    member_since: '2019-06-01',
    emergency_contact_name: 'Clara Thorne',
    emergency_contact_phone: '+1 (415) 555-0192',
    avatar_url: null,
  },
  {
    id: 'profile-2',
    name: 'Aunt Clara',
    email: 'clara@family',
    tier: 'family',
    member_since: '2019-06-01',
    emergency_contact_name: null,
    emergency_contact_phone: null,
    avatar_url: null,
  },
  {
    id: 'profile-3',
    name: 'David Miller',
    email: 'david@friends',
    tier: 'friends',
    member_since: '2022-03-15',
    emergency_contact_name: null,
    emergency_contact_phone: null,
    avatar_url: null,
  },
  {
    id: 'profile-4',
    name: 'Uncle Jack',
    email: 'jack@family',
    tier: 'family',
    member_since: '2019-06-01',
    emergency_contact_name: null,
    emergency_contact_phone: null,
    avatar_url: null,
  },
  {
    id: 'profile-5',
    name: 'Local Guide Sarah',
    email: 'sarah@public',
    tier: 'public',
    member_since: '2024-01-10',
    emergency_contact_name: null,
    emergency_contact_phone: null,
    avatar_url: null,
  },
  {
    id: 'profile-6',
    name: 'Marcus Vane',
    email: 'marcus@friends',
    tier: 'friends',
    member_since: '2023-08-20',
    emergency_contact_name: null,
    emergency_contact_phone: null,
    avatar_url: null,
  },
]

export const bookings: Booking[] = [
  {
    id: 'booking-1',
    profile_id: 'profile-1',
    start_date: '2024-10-18',
    end_date: '2024-10-31',
    guest_adults: 4,
    guest_children: 3,
    host_note: 'The wood stove in the master bedroom has been recently serviced. Feel free to use the stored birch on the shelf next to the stove.',
    status: 'confirmed',
    tier_at_booking: 'family',
    title: 'Winter Solstice Retreat',
    created_at: '2024-09-01T10:00:00Z',
  },
  {
    id: 'booking-2',
    profile_id: 'profile-1',
    start_date: '2025-03-01',
    end_date: '2025-03-06',
    guest_adults: 2,
    guest_children: 0,
    host_note: null,
    status: 'pending',
    tier_at_booking: 'family',
    title: 'Spring Thaw Weekend',
    created_at: '2024-11-15T14:30:00Z',
  },
  {
    id: 'booking-3',
    profile_id: 'profile-6',
    start_date: '2024-10-23',
    end_date: '2024-10-26',
    guest_adults: 2,
    guest_children: 0,
    host_note: null,
    status: 'pending',
    tier_at_booking: 'friends',
    title: 'Fall Getaway',
    created_at: '2024-09-20T09:00:00Z',
  },
  {
    id: 'booking-4',
    profile_id: 'profile-2',
    start_date: '2024-10-14',
    end_date: '2024-10-17',
    guest_adults: 2,
    guest_children: 1,
    host_note: null,
    status: 'confirmed',
    tier_at_booking: 'family',
    title: 'Columbus Day Weekend',
    created_at: '2024-09-05T11:00:00Z',
  },
  {
    id: 'booking-5',
    profile_id: 'profile-4',
    start_date: '2024-11-01',
    end_date: '2024-11-05',
    guest_adults: 3,
    guest_children: 0,
    host_note: null,
    status: 'confirmed',
    tier_at_booking: 'family',
    title: 'November Quiet',
    created_at: '2024-09-10T08:00:00Z',
  },
]

export const coopItems: CoopItem[] = [
  {
    id: 'coop-1',
    label: 'Food Provisions Bundle',
    subtitle: 'Pantry staples & fresh produce for 4',
    claimed_by: 'profile-2',
    created_at: '2024-09-01T00:00:00Z',
  },
  {
    id: 'coop-2',
    label: 'Propane Tank',
    subtitle: 'Standard 20 lb exchange',
    claimed_by: 'profile-1',
    created_at: '2024-09-01T00:00:00Z',
  },
  {
    id: 'coop-3',
    label: 'Fresh Firewood Bundle',
    subtitle: 'At least 0.25 cord of seasoned oak',
    claimed_by: null,
    created_at: '2024-09-01T00:00:00Z',
  },
  {
    id: 'coop-4',
    label: 'Propane & Appliances',
    subtitle: 'Check tank levels and test stove igniters',
    claimed_by: null,
    created_at: '2024-09-01T00:00:00Z',
  },
]

export const guestNotes: GuestNote[] = [
  {
    id: 'note-1',
    author_name: 'Margaret S.',
    title: 'Propane is Low',
    body: 'Just a heads-up for whoever is coming next — the propane for the outdoor grill is getting low. The tank is behind the shed. Probably has one or two good cookouts left in it.',
    note_date: '2024-10-10',
  },
  {
    id: 'note-2',
    author_name: 'The Miller Family',
    title: 'Bear Activity Near Trail',
    body: 'FYI we spotted a black bear and two cubs about a quarter mile up the east trail on Wednesday morning. Nothing aggressive, but wanted to give everyone a heads up. Keep food secured!',
    note_date: '2024-09-28',
  },
]

export const inventory: InventoryItem[] = [
  { id: 'inv-1', label: 'Dish Soap & Sponges', detail: 'Under the kitchen sink', icon: '🧴' },
  { id: 'inv-2', label: 'Paper Towels (2 rolls)', detail: 'Cabinet above the microwave', icon: '🧻' },
  { id: 'inv-3', label: 'Trash Bags (large, 10ct)', detail: 'Under kitchen sink', icon: '🗑️' },
  { id: 'inv-4', label: 'Laundry Detergent', detail: 'Mud room shelf', icon: '🫧' },
  { id: 'inv-5', label: 'First Aid Kit', detail: 'Master bathroom cabinet', icon: '🩹' },
  { id: 'inv-6', label: 'Flashlights (2)', detail: 'Drawer by the back door', icon: '🔦' },
  { id: 'inv-7', label: 'Real Firewood', detail: 'Stored on back porch', icon: '🪵' },
  { id: 'inv-8', label: 'Fire Extinguisher', detail: 'Kitchen wall mount — check annually', icon: '🧯' },
]

export const memoirs: Memoir[] = [
  {
    id: 'memoir-1',
    profile_id: 'profile-1',
    title: 'Summer Lake Dip',
    body: 'The water was surprisingly warm for July. Found a great patch of wild blueberries behind the old mill shed.',
    memoir_date: '2024-07-12',
    photo_count: 4,
  },
  {
    id: 'memoir-2',
    profile_id: 'profile-1',
    title: 'Autumn Solitude',
    body: 'Foggy mornings and long walks. The silence was exactly what I needed. Everything in the cabin was perfect.',
    memoir_date: '2023-11-02',
    photo_count: 7,
  },
]

export const adminBlocks: AdminBlock[] = [
  {
    id: 'block-1',
    start_date: '2024-11-20',
    end_date: '2024-11-30',
    reason: 'Winterization Maintenance',
  },
]

export const rates: Rate[] = [
  { id: 'rate-1', tier: 'public', nightly_rate: 250 },
  { id: 'rate-2', tier: 'friends', nightly_rate: 150 },
]
