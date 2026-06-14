import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import React, { useState, useMemo } from 'react'
import { useTier } from '../lib/context/TierContext'
import {
  getBookings, getAdminBlocks, getProfiles,
  updateBooking, updateBookingStatus,
} from '../lib/data/store'
import { Button } from '../components/ui/Button'
import { Input, TextArea } from '../components/ui/Input'
import type { Booking } from '../lib/types'

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

type DayEntry = {
  bookingId: string
  profileId: string
  isYours: boolean
  position: 'start' | 'middle' | 'end' | 'single'
  color: 'yours' | 'others' | 'block'
  title: string
}

function CalendarHome() {
  const router = useRouter()
  const { viewerTier, currentUser } = useTier()
  const { bookings: allBookings, adminBlocks, profiles } = Route.useLoaderData()

  const [view, setView] = useState<ViewMode>('calendar')
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  // Date range selection
  const [selStart, setSelStart] = useState<string | null>(null)
  const [selEnd, setSelEnd] = useState<string | null>(null)
  const [hoverDate, setHoverDate] = useState<string | null>(null)

  // Edit booking
  const [editBooking, setEditBooking] = useState<Booking | null>(null)
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [editGuests, setEditGuests] = useState(1)
  const [editNote, setEditNote] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const bookings = allBookings.filter(b => b.status !== 'cancelled')
  const today = new Date().toISOString().split('T')[0]

  // Build dateMap with position per day
  const dateMap = useMemo(() => {
    const map: Record<string, DayEntry> = {}

    for (const booking of bookings) {
      const isYours = booking.profile_id === currentUser.id
      const start = booking.start_date
      const end = booking.end_date
      const color: DayEntry['color'] = isYours ? 'yours' : 'others'

      const sd = new Date(start + 'T12:00:00')
      const ed = new Date(end + 'T12:00:00')

      if (start === end) {
        map[start] = { bookingId: booking.id, profileId: booking.profile_id, isYours, position: 'single', color, title: booking.title }
      } else {
        for (let d = new Date(sd); d <= ed; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().split('T')[0]
          const position: DayEntry['position'] = key === start ? 'start' : key === end ? 'end' : 'middle'
          map[key] = { bookingId: booking.id, profileId: booking.profile_id, isYours, position, color, title: booking.title }
        }
      }
    }

    for (const block of adminBlocks) {
      const start = block.start_date
      const end = block.end_date
      const sd = new Date(start + 'T12:00:00')
      const ed = new Date(end + 'T12:00:00')
      for (let d = new Date(sd); d <= ed; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0]
        const position: DayEntry['position'] = start === end ? 'single' : key === start ? 'start' : key === end ? 'end' : 'middle'
        map[key] = { bookingId: block.id, profileId: '', isYours: false, position, color: 'block', title: block.reason }
      }
    }

    return map
  }, [bookings, adminBlocks, currentUser.id])

  function getDayKey(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  // Effective end for hover preview
  const previewEnd = selEnd ?? (hoverDate && selStart && hoverDate !== selStart ? hoverDate : null)

  function isInRange(key: string): boolean {
    if (!selStart || !previewEnd) return false
    const lo = selStart < previewEnd ? selStart : previewEnd
    const hi = selStart < previewEnd ? previewEnd : selStart
    return key > lo && key < hi
  }

  function rangeEndpoint(key: string): 'start' | 'end' | null {
    if (key === selStart) return 'start'
    if (previewEnd && key === previewEnd) return 'end'
    return null
  }

  function handleDayClick(day: number) {
    const key = getDayKey(day)
    const info = dateMap[key]

    // Click on own upcoming booking → open edit
    if (info && info.isYours) {
      const bk = bookings.find(b => b.id === info.bookingId)
      if (bk && bk.start_date >= today) {
        setEditBooking(bk)
        setEditStart(bk.start_date)
        setEditEnd(bk.end_date)
        setEditGuests(bk.guest_adults)
        setEditNote(bk.host_note ?? '')
        setSelStart(null)
        setSelEnd(null)
        return
      }
    }

    // Two-click range selection
    if (!selStart || selEnd) {
      setSelStart(key)
      setSelEnd(null)
    } else if (key === selStart) {
      setSelStart(null)
    } else if (key < selStart) {
      setSelEnd(selStart)
      setSelStart(key)
    } else {
      setSelEnd(key)
    }
  }

  async function handleSaveEdit() {
    if (!editBooking) return
    setEditSaving(true)
    await updateBooking(editBooking.id, {
      start_date: editStart,
      end_date: editEnd,
      guest_adults: editGuests,
      host_note: editNote || null,
    })
    await router.invalidate()
    setEditSaving(false)
    setEditBooking(null)
  }

  async function handleCancelBooking() {
    if (!editBooking) return
    await updateBookingStatus(editBooking.id, 'cancelled')
    await router.invalidate()
    setEditBooking(null)
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const upcomingBookings = bookings
    .filter(b => b.end_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  // Nights in current selection
  const confirmedEnd = selEnd
  const selNights = selStart && confirmedEnd
    ? Math.round((new Date(confirmedEnd).getTime() - new Date(selStart).getTime()) / 86400000)
    : 0

  return (
    <div>
      {/* Hero */}
      <div className="relative h-[280px] md:h-[360px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=1600&q=80')` }}
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
            <p className="font-manrope text-sm text-outline mt-0.5">
              {selStart && !selEnd
                ? 'Now click your departure date'
                : selStart && selEnd
                ? `${selNights} night${selNights !== 1 ? 's' : ''} selected`
                : 'Click a date to start your selection'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('calendar')}
              className={['px-4 py-2 rounded text-sm font-manrope font-semibold transition-colors',
                view === 'calendar' ? 'bg-primary text-on-primary' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container',
              ].join(' ')}
            >
              Calendar
            </button>
            <button
              onClick={() => setView('upcoming')}
              className={['px-4 py-2 rounded text-sm font-manrope font-semibold transition-colors',
                view === 'upcoming' ? 'bg-primary text-on-primary' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container',
              ].join(' ')}
            >
              Upcoming Stays
            </button>
          </div>
        </div>

        {view === 'calendar' ? (
          <div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg card-shadow overflow-hidden">
              {/* Month nav */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
                <button
                  onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }}
                  className="p-2 hover:bg-surface-container rounded transition-colors text-on-surface-variant"
                >←</button>
                <span className="font-literata font-semibold text-xl text-on-surface">{MONTHS[month]} {year}</span>
                <button
                  onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }}
                  className="p-2 hover:bg-surface-container rounded transition-colors text-on-surface-variant"
                >→</button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-outline-variant">
                {DAYS.map(d => (
                  <div key={d} className="py-3 text-center text-xs font-manrope font-semibold text-outline tracking-wider">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells — square */}
              <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  if (day === null) {
                    return (
                      <div
                        key={`empty-${i}`}
                        className="aspect-square bg-surface-container/30 border-r border-b border-outline-variant/50"
                      />
                    )
                  }

                  const key = getDayKey(day)
                  const info = dateMap[key]
                  const endpoint = rangeEndpoint(key)
                  const inRange = isInRange(key)
                  const isToday = key === today

                  // Determine the strip type to render
                  // Selection overrides booking visuals for endpoints
                  const selPosition: DayEntry['position'] | null =
                    endpoint === 'start' ? (previewEnd && key < previewEnd ? 'start' : 'single')
                    : endpoint === 'end' ? (selStart && key > selStart ? 'end' : 'single')
                    : inRange ? 'middle'
                    : null

                  const bookingPosition = info?.position ?? null
                  const activePosition = selPosition ?? bookingPosition

                  // Strip background
                  const stripBg = selPosition
                    ? 'bg-primary/20'
                    : info?.color === 'yours' ? 'bg-primary/20'
                    : info?.color === 'others' ? 'bg-secondary-container'
                    : info?.color === 'block' ? 'bg-surface-container-highest'
                    : ''

                  // Day circle
                  const circleActive = endpoint !== null || info?.position === 'start' || info?.position === 'end' || info?.position === 'single'
                  const circleBg =
                    endpoint !== null ? 'bg-primary text-on-primary font-semibold'
                    : info?.color === 'yours' && circleActive ? 'bg-primary text-on-primary font-semibold'
                    : info?.color === 'others' && circleActive ? 'bg-secondary text-on-secondary font-semibold'
                    : info?.color === 'block' && circleActive ? 'bg-surface-container-highest text-on-surface-variant font-semibold'
                    : isToday && !info ? 'bg-primary text-on-primary font-bold'
                    : 'text-on-surface'

                  // Label shown under the circle (only at start/single for name or yours)
                  let label: string | null = null
                  if (info && (info.position === 'start' || info.position === 'single')) {
                    if (info.color === 'block') {
                      label = null
                    } else if (info.isYours) {
                      label = 'Check In'
                    } else if (viewerTier === 'family') {
                      label = profiles.find(p => p.id === info.profileId)?.name.split(' ')[0] ?? 'In'
                    } else {
                      label = 'In'
                    }
                  }

                  return (
                    <div
                      key={day}
                      className="relative aspect-square border-r border-b border-outline-variant/50 cursor-pointer select-none"
                      onClick={() => handleDayClick(day)}
                      onMouseEnter={() => { if (selStart && !selEnd) setHoverDate(key) }}
                      onMouseLeave={() => setHoverDate(null)}
                    >
                      {/* Strip layer */}
                      {activePosition === 'start' && stripBg && (
                        <div className={`absolute top-[38%] bottom-[38%] left-1/2 right-0 ${stripBg}`} />
                      )}
                      {activePosition === 'middle' && stripBg && (
                        <div className={`absolute top-[38%] bottom-[38%] inset-x-0 ${stripBg}`} />
                      )}
                      {activePosition === 'end' && stripBg && (
                        <div className={`absolute top-[38%] bottom-[38%] left-0 right-1/2 ${stripBg}`} />
                      )}
                      {activePosition === 'single' && stripBg && (
                        <div className={`absolute inset-[22%] rounded-full ${stripBg}`} />
                      )}

                      {/* Content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 hover:opacity-80 transition-opacity">
                        <span className={`relative z-10 w-7 h-7 flex items-center justify-center rounded-full text-xs font-manrope ${circleBg}`}>
                          {day}
                        </span>
                        {label && (
                          <span className={`relative z-10 text-[9px] font-manrope leading-none truncate max-w-full px-0.5 ${info?.isYours ? 'text-primary' : 'text-secondary'}`}>
                            {label}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Booking action panel */}
            {selStart && (
              <div className="mt-4 flex items-center justify-between gap-4 p-4 bg-primary-container rounded-lg border border-primary/20">
                <div>
                  {selEnd ? (
                    <p className="font-literata font-semibold text-on-primary-container">
                      {selStart} → {selEnd}
                      <span className="font-manrope font-normal text-sm ml-2 text-on-primary-container/70">
                        ({selNights} night{selNights !== 1 ? 's' : ''})
                      </span>
                    </p>
                  ) : (
                    <p className="font-manrope text-sm text-on-primary-container/80">Select your departure date on the calendar</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { setSelStart(null); setSelEnd(null) }}
                    className="text-sm font-manrope text-on-primary-container/60 hover:text-on-primary-container transition-colors"
                  >
                    Clear
                  </button>
                  {selEnd && (
                    <Link to="/bookings/new" search={{ start: selStart, end: selEnd }}>
                      <Button size="sm">Book Stay</Button>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-6 mt-5">
              <LegendItem color="bg-primary" label="Your Bookings" />
              <LegendItem color="bg-secondary-container border border-on-secondary-container/20" label="Other Stays" />
              <LegendItem color="bg-surface-container-highest border border-outline-variant" label="Maintenance Block" />
            </div>

            <div className="mt-[40px] flex justify-center">
              <Link to="/bookings/new">
                <Button size="lg" className="px-8">Book Stay</Button>
              </Link>
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
                      <p className="font-manrope text-sm text-outline mt-0.5">
                        {booking.start_date} – {booking.end_date}
                        {showDetails && profile ? ` · ${profile.name}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={[
                        'px-3 py-1 rounded-full text-xs font-manrope font-semibold uppercase',
                        booking.status === 'confirmed'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-primary-fixed text-on-primary-fixed',
                      ].join(' ')}>
                        {booking.status}
                      </span>
                      {isYours && booking.start_date >= today && (
                        <button
                          onClick={() => {
                            setEditBooking(booking)
                            setEditStart(booking.start_date)
                            setEditEnd(booking.end_date)
                            setEditGuests(booking.guest_adults)
                            setEditNote(booking.host_note ?? '')
                          }}
                          className="text-xs font-manrope font-semibold text-primary hover:underline"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-[64px]" />

      {/* Edit booking modal */}
      {editBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setEditBooking(null)}
          />
          <div className="relative bg-surface-container-lowest rounded-xl card-shadow w-full max-w-md p-6 z-10">
            <h2 className="font-literata font-semibold text-xl text-on-surface mb-1">Edit Stay</h2>
            <p className="font-manrope text-sm text-outline mb-5">{editBooking.title}</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Check In"
                  type="date"
                  value={editStart}
                  onChange={e => setEditStart(e.target.value)}
                />
                <Input
                  label="Check Out"
                  type="date"
                  value={editEnd}
                  min={editStart}
                  onChange={e => setEditEnd(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-manrope font-semibold text-on-surface-variant block mb-1.5">Guests</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditGuests(g => Math.max(1, g - 1))}
                    className="w-8 h-8 rounded border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
                  >−</button>
                  <span className="font-manrope font-semibold text-on-surface w-20 text-center">{editGuests} Guest{editGuests !== 1 ? 's' : ''}</span>
                  <button
                    type="button"
                    onClick={() => setEditGuests(g => g + 1)}
                    className="w-8 h-8 rounded border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
                  >+</button>
                </div>
              </div>

              <TextArea
                label="Host Note (Optional)"
                rows={3}
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
                placeholder="Any notes for your stay…"
              />

              <div className="flex gap-3 pt-1">
                <Button onClick={handleSaveEdit} disabled={editSaving} className="flex-1">
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </Button>
                <Button variant="ghost" onClick={() => setEditBooking(null)} className="flex-1">
                  Close
                </Button>
              </div>

              <hr className="border-outline-variant" />

              <Button variant="danger" onClick={handleCancelBooking} className="w-full">
                Cancel This Booking
              </Button>
            </div>
          </div>
        </div>
      )}
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
