import type {
  Profile, Booking, CoopItem, GuestNote,
  InventoryItem, Memoir, AdminBlock, Rate, Tier
} from '../types'
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

// Mutable in-memory store (simulates DB)
let _profiles: Profile[] = [...seedProfiles]
let _bookings: Booking[] = [...seedBookings]
let _coopItems: CoopItem[] = [...seedCoopItems]
let _guestNotes: GuestNote[] = [...seedGuestNotes]
let _inventory: InventoryItem[] = [...seedInventory]
let _memoirs: Memoir[] = [...seedMemoirs]
let _adminBlocks: AdminBlock[] = [...seedAdminBlocks]
let _rates: Rate[] = [...seedRates]

// ---- Profiles ----
export function getProfiles(): Profile[] {
  return _profiles
}

export function getProfile(id: string): Profile | undefined {
  return _profiles.find(p => p.id === id)
}

export function updateProfileTier(id: string, tier: Tier): void {
  _profiles = _profiles.map(p => p.id === id ? { ...p, tier } : p)
}

export function updateProfile(id: string, updates: Partial<Profile>): void {
  _profiles = _profiles.map(p => p.id === id ? { ...p, ...updates } : p)
}

// ---- Bookings ----
export function getBookings(): Booking[] {
  return _bookings
}

export function getBookingsByProfile(profileId: string): Booking[] {
  return _bookings.filter(b => b.profile_id === profileId)
}

export function getUpcomingBookings(): Booking[] {
  const today = new Date().toISOString().split('T')[0]
  return _bookings
    .filter(b => b.end_date >= today && b.status !== 'cancelled')
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
}

export function createBooking(booking: Omit<Booking, 'id' | 'created_at'>): Booking {
  const newBooking: Booking = {
    ...booking,
    id: `booking-${Date.now()}`,
    created_at: new Date().toISOString(),
  }
  _bookings = [..._bookings, newBooking]
  return newBooking
}

export function updateBookingStatus(id: string, status: Booking['status']): void {
  _bookings = _bookings.map(b => b.id === id ? { ...b, status } : b)
}

// ---- Co-op Items ----
export function getCoopItems(): CoopItem[] {
  return _coopItems
}

export function claimCoopItem(itemId: string, profileId: string): void {
  _coopItems = _coopItems.map(item =>
    item.id === itemId ? { ...item, claimed_by: profileId } : item
  )
}

export function unclaimCoopItem(itemId: string): void {
  _coopItems = _coopItems.map(item =>
    item.id === itemId ? { ...item, claimed_by: null } : item
  )
}

// ---- Guest Notes ----
export function getGuestNotes(): GuestNote[] {
  return _guestNotes
}

export function addGuestNote(note: Omit<GuestNote, 'id'>): GuestNote {
  const newNote: GuestNote = {
    ...note,
    id: `note-${Date.now()}`,
  }
  _guestNotes = [..._guestNotes, newNote]
  return newNote
}

// ---- Inventory ----
export function getInventory(): InventoryItem[] {
  return _inventory
}

// ---- Memoirs ----
export function getMemoirs(): Memoir[] {
  return _memoirs
}

export function getMemoirsByProfile(profileId: string): Memoir[] {
  return _memoirs.filter(m => m.profile_id === profileId)
}

// ---- Admin Blocks ----
export function getAdminBlocks(): AdminBlock[] {
  return _adminBlocks
}

export function addAdminBlock(block: Omit<AdminBlock, 'id'>): AdminBlock {
  const newBlock: AdminBlock = {
    ...block,
    id: `block-${Date.now()}`,
  }
  _adminBlocks = [..._adminBlocks, newBlock]
  return newBlock
}

export function removeAdminBlock(id: string): void {
  _adminBlocks = _adminBlocks.filter(b => b.id !== id)
}

// ---- Rates ----
export function getRates(): Rate[] {
  return _rates
}

export function updateRate(tier: Tier, nightly_rate: number): void {
  const exists = _rates.find(r => r.tier === tier)
  if (exists) {
    _rates = _rates.map(r => r.tier === tier ? { ...r, nightly_rate } : r)
  } else {
    _rates = [..._rates, { id: `rate-${Date.now()}`, tier, nightly_rate }]
  }
}

export function getRateForTier(tier: Tier): number {
  if (tier === 'family') return 0
  const rate = _rates.find(r => r.tier === tier)
  return rate ? rate.nightly_rate : 0
}

// ---- KPI helpers ----
export function getTotalNightsBooked(): number {
  const confirmed = _bookings.filter(b => b.status === 'confirmed')
  return confirmed.reduce((sum, b) => {
    const start = new Date(b.start_date)
    const end = new Date(b.end_date)
    return sum + Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }, 0)
}

export function getCabinRevenue(): number {
  return _bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => {
      const start = new Date(b.start_date)
      const end = new Date(b.end_date)
      const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const rate = getRateForTier(b.tier_at_booking)
      return sum + nights * rate
    }, 0)
}
