import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import React, { useState, useMemo } from 'react'
import { useTier } from '../lib/context/TierContext'
import { getBookings, getAdminBlocks, getProfiles } from '../lib/data/store'
import { Button } from '../components/ui/Button'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [bookings, adminBlocks, profiles] = await Promise.all([
      getBookings(),
      getAdminBlocks(),
      getProfiles(),
    ])
    return { bookings, adminBlocks, profiles }
  },
  component: CalendarHome,
})

type ViewMode = 'calendar' | 'upcoming'

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

function CalendarHome() {
  const { viewerTier, currentUser } = useTier()
  const { bookings: allBookings, adminBlocks, profiles } = Route.useLoaderData()
  const [view, setView] = useState<ViewMode>('calendar')
  const [year, setYear] = useState(2024)
  const [month, setMonth] = useState(9)

  const bookings = allBookings.filter(b => b.status !== 'cancelled')

  const dateMap = useMemo(() => {
    const map: Record<string, { type: 'your' | 'others' | 'block'; bookingId?: string; profileId?: string }> = {}

    for (const booking of bookings) {
      const start = new Date(booking.start_date)
      const end = new Date(booking.end_date)
      const isYours = booking.profile_id === currentUser.id
      const type = isYours ? 'your' : 'others'
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0]
        map[key] = { type, bookingId: booking.id, profileId: booking.profile_id }
      }
    }

    for (const block of adminBlocks) {
      const start = new Date(block.start_date)
      const end = new Date(block.end_date)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0]
        map[key] = { type: 'block' }
      }
    }

    return map
  }, [bookings, adminBlocks, currentUser.id])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function getDayKey(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function getDayLabel(day: number): string | null {
    const key = getDayKey(day)
    const info = dateMap[key]
    if (!info) return null
    if (info.type === 'your') return 'Your Stay'
    if (info.type === 'block') return 'Blocked'
    if (info.type === 'others') {
      if (viewerTier === 'family') {
        const booking = bookings.find(b =>
          key >= b.start_date && key <= b.end_date && b.profile_id === info.profileId
        )
        if (booking) {
          const profile = profiles.find(p => p.id === booking.profile_id)
          return profile?.name.split(' ')[0] ?? 'Reserved'
        }
      }
      return 'Reserved'
    }
    return null
  }

  function getCellStyle(day: number): string {
    const key = getDayKey(day)
    const info = dateMap[key]
    if (!info) return ''
    if (info.type === 'your') return 'bg-primary text-on-primary rounded'
    if (info.type === 'block') return 'bg-surface-container-highest text-on-surface-variant rounded'
    if (info.type === 'others') return 'bg-secondary-container text-on-secondary-container rounded'
    return ''
  }

  const today = new Date().toISOString().split('T')[0]

  const upcomingBookings = bookings
    .filter(b => b.end_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  return (
    <div>
      {/* Hero */}
      <div className="relative h-[280px] md:h-[360px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=1600&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-primary/70" />
        <div className="absolute inset-0 flex flex-col justify-end px-5 md:px-[80px] pb-10">
          <h1 className="font-literata font-bold text-4xl md:text-[48px] text-white leading-tight tracking-tight">
            Welcome to The Cabin Beyond The End
          </h1>
          <p className="font-manrope text-white/80 text-base md:text-lg mt-2">
            Gather well, and cherish the times in the quiet of the woods.
          </p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-5 md:px-[80px] mt-[64px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-literata font-semibold text-[32px] text-on-surface">Availability</h2>
            <p className="font-manrope text-sm text-outline mt-0.5 flex items-center gap-1">
              <span>📅</span>
              <span>{MONTHS[month].toUpperCase()} {year}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('calendar')}
              className={[
                'px-4 py-2 rounded text-sm font-manrope font-semibold transition-colors',
                view === 'calendar' ? 'bg-primary text-on-primary' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container',
              ].join(' ')}
            >
              Calendar
            </button>
            <button
              onClick={() => setView('upcoming')}
              className={[
                'px-4 py-2 rounded text-sm font-manrope font-semibold transition-colors',
                view === 'upcoming' ? 'bg-primary text-on-primary' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container',
              ].join(' ')}
            >
              Upcoming Stays
            </button>
          </div>
        </div>

        {view === 'calendar' ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg card-shadow overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
              <button onClick={prevMonth} className="p-2 hover:bg-surface-container rounded transition-colors text-on-surface-variant">
                ←
              </button>
              <span className="font-literata font-semibold text-xl text-on-surface">
                {MONTHS[month]} {year}
              </span>
              <button onClick={nextMonth} className="p-2 hover:bg-surface-container rounded transition-colors text-on-surface-variant">
                →
              </button>
            </div>

            <div className="grid grid-cols-7 border-b border-outline-variant">
              {DAYS.map(d => (
                <div key={d} className="py-3 text-center text-xs font-manrope font-semibold text-outline tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-outline-variant/50">
              {cells.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} className="h-20 bg-surface-container/30" />
                const cellStyle = getCellStyle(day)
                const label = getDayLabel(day)
                const isToday = getDayKey(day) === today
                return (
                  <div key={day} className="h-20 p-1.5 flex flex-col group hover:bg-surface-container-low transition-colors">
                    <span className={[
                      'text-sm font-manrope w-7 h-7 flex items-center justify-center rounded-full',
                      isToday ? 'bg-primary text-on-primary font-bold' : 'text-on-surface',
                    ].join(' ')}>
                      {day}
                    </span>
                    {label && (
                      <span className={[
                        'mt-1 text-xs font-manrope font-semibold px-1.5 py-0.5 truncate',
                        cellStyle,
                      ].join(' ')}>
                        {label}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingBookings.length === 0 && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-8 text-center">
                <p className="font-manrope text-outline">No upcoming stays.</p>
              </div>
            )}
            {upcomingBookings.map(booking => {
              const profile = profiles.find(p => p.id === booking.profile_id)
              const isYours = booking.profile_id === currentUser.id
              const showDetails = viewerTier === 'family' || isYours
              return (
                <div key={booking.id} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 card-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-literata font-semibold text-lg text-on-surface">
                        {showDetails ? booking.title : 'Reserved'}
                      </p>
                      {showDetails && (
                        <p className="font-manrope text-sm text-outline mt-0.5">
                          {booking.start_date} – {booking.end_date} · {profile?.name}
                        </p>
                      )}
                      {!showDetails && (
                        <p className="font-manrope text-sm text-outline mt-0.5">
                          {booking.start_date} – {booking.end_date}
                        </p>
                      )}
                    </div>
                    <span className={[
                      'shrink-0 px-3 py-1 rounded-full text-xs font-manrope font-semibold uppercase',
                      booking.status === 'confirmed'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-primary-fixed text-on-primary-fixed',
                    ].join(' ')}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-6 mt-6">
          <LegendItem color="bg-primary" label="Your Bookings" />
          <LegendItem color="bg-secondary-container border border-on-secondary-container/20" label="Confirmed Stays" />
          <LegendItem color="bg-surface-container-highest border border-outline-variant" label="Available" />
        </div>

        <div className="mt-[64px] flex justify-center">
          <Link to="/bookings/new">
            <Button size="lg" className="px-8">Reserve Your Time</Button>
          </Link>
        </div>
      </div>

      <div className="mt-[64px]" />
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-4 h-4 rounded ${color}`} />
      <span className="font-manrope text-sm text-on-surface-variant">{label}</span>
    </div>
  )
}
