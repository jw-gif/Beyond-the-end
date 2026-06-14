import React, { createContext, useContext, useState } from 'react'
import type { Tier, Profile } from '../types'

// Lightweight dev-session stubs — not stored in the DB, just for the tier switcher
const DEMO_USERS: Record<Tier, Profile> = {
  family: {
    id: 'dev-family',
    name: 'Family User',
    email: 'family@cabin.local',
    tier: 'family',
    member_since: '2020-01-01',
    emergency_contact_name: null,
    emergency_contact_phone: null,
    avatar_url: null,
  },
  friends: {
    id: 'dev-friends',
    name: 'Friends User',
    email: 'friends@cabin.local',
    tier: 'friends',
    member_since: '2022-01-01',
    emergency_contact_name: null,
    emergency_contact_phone: null,
    avatar_url: null,
  },
  public: {
    id: 'dev-public',
    name: 'Public Guest',
    email: 'guest@cabin.local',
    tier: 'public',
    member_since: '2024-01-01',
    emergency_contact_name: null,
    emergency_contact_phone: null,
    avatar_url: null,
  },
}

interface TierContextValue {
  currentUser: Profile
  viewerTier: Tier
  setViewerTier: (tier: Tier) => void
}

const TierContext = createContext<TierContextValue | null>(null)

export function TierProvider({ children }: { children: React.ReactNode }) {
  const [viewerTier, setViewerTierState] = useState<Tier>('family')

  function setViewerTier(tier: Tier) {
    setViewerTierState(tier)
  }

  const currentUser = DEMO_USERS[viewerTier]

  return (
    <TierContext.Provider value={{ currentUser, viewerTier, setViewerTier }}>
      {children}
    </TierContext.Provider>
  )
}

export function useTier() {
  const ctx = useContext(TierContext)
  if (!ctx) throw new Error('useTier must be used inside TierProvider')
  return ctx
}
