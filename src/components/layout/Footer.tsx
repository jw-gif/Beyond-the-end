import React from 'react'
import { Link } from '@tanstack/react-router'

export function Footer() {
  return (
    <footer className="border-t border-outline-variant mt-[64px]">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[80px] py-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <p className="font-literata font-semibold text-lg text-primary">The Family Cabin</p>
            <p className="font-manrope text-sm text-outline mt-1">
              © {new Date().getFullYear()} The Family Cabin. Kinship & Quietude.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { label: 'House Rules', to: '/' },
              { label: 'Maintenance Log', to: '/admin' },
              { label: 'Emergency Contacts', to: '/bookings' },
              { label: 'Guest Memoirs', to: '/coop' },
            ].map(item => (
              <Link
                key={item.label}
                to={item.to}
                className="font-manrope text-sm text-outline hover:text-on-surface transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
