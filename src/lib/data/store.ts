import type {
  Profile, Booking, CoopItem, GuestNote,
  InventoryItem, Memoir, AdminBlock, Rate, Tier
} from '../types'
import { supabase, isSupabaseEnabled } from '../supabase'
import {
  profiles as seedProfiles,
  bookings as seedBookings,
  coopItems as seedCoopItems,
  guestNotes as seedGuestNotes,
  inventory as seedInventory,
  memoirs as seedMemoirs,
  adminBlocks as seedAdminBlocks,
  rates as seedRates,
} from './seed'

// ---- In-memory fallback store ----
let _profiles: Profile[] = [...seedProfiles]
let _bookings: Booking[] = [...seedBookings]
let _coopItems: CoopItem[] = [...seedCoopItems]
let _guestNotes: GuestNote[] = [...seedGuestNotes]
let _inventory: InventoryItem[] = [...seedInventory]
let _memoirs: Memoir[] = [...seedMemoirs]
let _adminBlocks: AdminBlock[] = [...seedAdminBlocks]
let _rates: Rate[] = [...seedRates]

// ---- Profiles ----
export async function getProfiles(): Promise<Profile[]> {
  if (isSupabaseEnabled) {
    const { data } = await supabase!.from('profiles').select('*').order('name')
    return (data ?? []) as Profile[]
  }
  return _profiles
}

export async function getProfile(id: string): Promise<Profile | undefined> {
  if (isSupabaseEnabled) {
    const { data } = await supabase!.from('profiles').select('*').eq('id', id).single()
    return data as Profile | undefined
  }
  return _profiles.find(p => p.id === id)
}

export async function updateProfileTier(id: string, tier: Tier): Promise<void> {
  if (isSupabaseEnabled) {
    await supabase!.from('profiles').update({ tier }).eq('id', id)
    return
  }
  _profiles = _profiles.map(p => p.id === id ? { ...p, tier } : p)
}

export async function updateProfile(id: string, updates: Partial<Profile>): Promise<void> {
  if (isSupabaseEnabled) {
    await supabase!.from('profiles').update(updates).eq('id', id)
    return
  }
  _profiles = _profiles.map(p => p.id === id ? { ...p, ...updates } : p)
}

// ---- Bookings ----
export async function getBookings(): Promise<Booking[]> {
  if (isSupabaseEnabled) {
    const { data } = await supabase!.from('bookings').select('*').order('start_date')
    return (data ?? []) as Booking[]
  }
  return _bookings
}

export async function getBookingsByProfile(profileId: string): Promise<Booking[]> {
  if (isSupabaseEnabled) {
    const { data } = await supabase!.from('bookings').select('*').eq('profile_id', profileId).order('start_date')
    return (data ?? []) as Booking[]
  }
  return _bookings.filter(b => b.profile_id === profileId)
}

export async function getUpcomingBookings(): Promise<Booking[]> {
  const today = new Date().toISOString().split('T')[0]
  if (isSupabaseEnabled) {
    const { data } = await supabase!
      .from('bookings')
      .select('*')
      .gte('end_date', today)
      .neq('status', 'cancelled')
      .order('start_date')
    return (data ?? []) as Booking[]
  }
  return _bookings
    .filter(b => b.end_date >= today && b.status !== 'cancelled')
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
}

export async function createBooking(booking: Omit<Booking, 'id' | 'created_at'>): Promise<Booking> {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase!.from('bookings').insert(booking).select().single()
    if (error) throw error
    return data as Booking
  }
  const newBooking: Booking = {
    ...booking,
    id: `booking-${Date.now()}`,
    created_at: new Date().toISOString(),
  }
  _bookings = [..._bookings, newBooking]
  return newBooking
}

export async function updateBookingStatus(id: string, status: Booking['status']): Promise<void> {
  if (isSupabaseEnabled) {
    await supabase!.from('bookings').update({ status }).eq('id', id)
    return
  }
  _bookings = _bookings.map(b => b.id === id ? { ...b, status } : b)
}

export async function updateBooking(id: string, updates: Partial<Omit<Booking, 'id' | 'created_at'>>): Promise<void> {
  if (isSupabaseEnabled) {
    await supabase!.from('bookings').update(updates).eq('id', id)
    return
  }
  _bookings = _bookings.map(b => b.id === id ? { ...b, ...updates } : b)
}

// ---- Co-op Items ----
export async function getCoopItems(): Promise<CoopItem[]> {
  if (isSupabaseEnabled) {
    const { data } = await supabase!.from('coop_items').select('*').order('created_at')
    return (data ?? []) as CoopItem[]
  }
  return _coopItems
}

export async function claimCoopItem(itemId: string, profileId: string): Promise<void> {
  if (isSupabaseEnabled) {
    await supabase!.from('coop_items').update({ claimed_by: profileId }).eq('id', itemId)
    return
  }
  _coopItems = _coopItems.map(item =>
    item.id === itemId ? { ...item, claimed_by: profileId } : item
  )
}

export async function unclaimCoopItem(itemId: string): Promise<void> {
  if (isSupabaseEnabled) {
    await supabase!.from('coop_items').update({ claimed_by: null }).eq('id', itemId)
    return
  }
  _coopItems = _coopItems.map(item =>
    item.id === itemId ? { ...item, claimed_by: null } : item
  )
}

// ---- Guest Notes ----
export async function getGuestNotes(): Promise<GuestNote[]> {
  if (isSupabaseEnabled) {
    const { data } = await supabase!.from('guest_notes').select('*').order('note_date', { ascending: false })
    return (data ?? []) as GuestNote[]
  }
  return _guestNotes
}

export async function addGuestNote(note: Omit<GuestNote, 'id'>): Promise<GuestNote> {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase!.from('guest_notes').insert(note).select().single()
    if (error) throw error
    return data as GuestNote
  }
  const newNote: GuestNote = { ...note, id: `note-${Date.now()}` }
  _guestNotes = [..._guestNotes, newNote]
  return newNote
}

// ---- Inventory ----
export async function getInventory(): Promise<InventoryItem[]> {
  if (isSupabaseEnabled) {
    const { data } = await supabase!.from('inventory').select('*').order('label')
    return (data ?? []) as InventoryItem[]
  }
  return _inventory
}

// ---- Memoirs ----
export async function getMemoirs(): Promise<Memoir[]> {
  if (isSupabaseEnabled) {
    const { data } = await supabase!.from('memoirs').select('*').order('memoir_date', { ascending: false })
    return (data ?? []) as Memoir[]
  }
  return _memoirs
}

export async function getMemoirsByProfile(profileId: string): Promise<Memoir[]> {
  if (isSupabaseEnabled) {
    const { data } = await supabase!
      .from('memoirs')
      .select('*')
      .eq('profile_id', profileId)
      .order('memoir_date', { ascending: false })
    return (data ?? []) as Memoir[]
  }
  return _memoirs.filter(m => m.profile_id === profileId)
}

// ---- Admin Blocks ----
export async function getAdminBlocks(): Promise<AdminBlock[]> {
  if (isSupabaseEnabled) {
    const { data } = await supabase!.from('admin_blocks').select('*').order('start_date')
    return (data ?? []) as AdminBlock[]
  }
  return _adminBlocks
}

export async function addAdminBlock(block: Omit<AdminBlock, 'id'>): Promise<AdminBlock> {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase!.from('admin_blocks').insert(block).select().single()
    if (error) throw error
    return data as AdminBlock
  }
  const newBlock: AdminBlock = { ...block, id: `block-${Date.now()}` }
  _adminBlocks = [..._adminBlocks, newBlock]
  return newBlock
}

export async function removeAdminBlock(id: string): Promise<void> {
  if (isSupabaseEnabled) {
    await supabase!.from('admin_blocks').delete().eq('id', id)
    return
  }
  _adminBlocks = _adminBlocks.filter(b => b.id !== id)
}

// ---- Rates ----
export async function getRates(): Promise<Rate[]> {
  if (isSupabaseEnabled) {
    const { data } = await supabase!.from('rates').select('*')
    return (data ?? []) as Rate[]
  }
  return _rates
}

export async function updateRate(tier: Tier, nightly_rate: number): Promise<void> {
  if (isSupabaseEnabled) {
    await supabase!.from('rates').upsert({ tier, nightly_rate }, { onConflict: 'tier' })
    return
  }
  const exists = _rates.find(r => r.tier === tier)
  if (exists) {
    _rates = _rates.map(r => r.tier === tier ? { ...r, nightly_rate } : r)
  } else {
    _rates = [..._rates, { id: `rate-${Date.now()}`, tier, nightly_rate }]
  }
}

export async function getRateForTier(tier: Tier): Promise<number> {
  if (tier === 'family') return 0
  if (isSupabaseEnabled) {
    const { data } = await supabase!.from('rates').select('nightly_rate').eq('tier', tier).single()
    return data ? Number(data.nightly_rate) : 0
  }
  const rate = _rates.find(r => r.tier === tier)
  return rate ? rate.nightly_rate : 0
}

// ---- KPI helpers ----
export async function getTotalNightsBooked(): Promise<number> {
  const bookings = await getBookings()
  const confirmed = bookings.filter(b => b.status === 'confirmed')
  return confirmed.reduce((sum, b) => {
    const start = new Date(b.start_date)
    const end = new Date(b.end_date)
    return sum + Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }, 0)
}

export async function getCabinRevenue(): Promise<number> {
  const [bookings, rates] = await Promise.all([getBookings(), getRates()])
  const rateMap = Object.fromEntries(rates.map(r => [r.tier, r.nightly_rate]))
  return bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => {
      const start = new Date(b.start_date)
      const end = new Date(b.end_date)
      const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const rate = b.tier_at_booking === 'family' ? 0 : (rateMap[b.tier_at_booking] ?? 0)
      return sum + nights * rate
    }, 0)
}
