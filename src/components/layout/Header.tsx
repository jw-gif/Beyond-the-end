import React from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { useTier } from '../../lib/context/TierContext'
import type { Tier } from '../../lib/types'

const NAV_LINKS = [
  { to: '/', label: 'Calendar' },
  { to: '/bookings', label: 'My Bookings' },
  { to: '/coop', label: 'Co-op' },
  { to: '/admin', label: 'Admin' },
]

export function Header() {
  const { viewerTier, setViewerTier, currentUser } = useTier()
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-outline-variant">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[80px] h-14 flex items-center justify-between gap-4">
        <Link to="/" className="font-literata font-semibold text-xl text-primary whitespace-nowrap">
          The Family Cabin
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(link => {
            const isActive = link.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(link.to)
            return (
              <Link
                key={link.to}
                to={link.to}
                className={[
                  'text-sm font-manrope font-medium transition-colors',
                  isActive
                    ? 'text-primary border-b-2 border-primary pb-0.5'
                    : 'text-on-surface-variant hover:text-on-surface',
                ].join(' ')}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          {/* Dev-only tier switcher */}
          <div className="flex items-center gap-2 bg-surface-container-low rounded px-2 py-1 border border-outline-variant">
            <span className="text-xs font-manrope text-outline">View as:</span>
            <select
              value={viewerTier}
              onChange={e => setViewerTier(e.target.value as Tier)}
              className="text-xs font-manrope font-semibold text-primary bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="family">Family</option>
              <option value="friends">Friends</option>
              <option value="public">Public</option>
            </select>
          </div>

          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
            <span className="text-xs font-manrope font-bold text-on-primary-container">
              {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex md:hidden items-center gap-1 px-5 pb-2 overflow-x-auto">
        {NAV_LINKS.map(link => {
          const isActive = link.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(link.to)
          return (
            <Link
              key={link.to}
              to={link.to}
              className={[
                'text-sm font-manrope font-medium px-3 py-1 rounded transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container',
              ].join(' ')}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
