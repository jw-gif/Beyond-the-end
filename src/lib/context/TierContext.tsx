import React, { createContext, useContext, useState } from 'react'
import type { Tier, Profile } from '../types'
import { profiles } from '../data/seed'

// Demo sessions keyed by tier
const DEMO_USERS: Record<Tier, Profile> = {
  family: profiles[0],   // Julian Thorne
  friends: profiles[2],  // David Miller
  public: profiles[4],   // Local Guide Sarah
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
