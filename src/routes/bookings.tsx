import { createFileRoute, useRouter } from '@tanstack/react-router'
import React, { useState, useMemo } from 'react'
import { useTier } from '../lib/context/TierContext'
import { getBookings, getMemoirs, getRates, updateProfile, createBooking } from '../lib/data/store'
import { Card } from '../components/ui/Card'
import { Chip, StatusBadge } from '../components/ui/Chip'
import { Button } from '../components/ui/Button'
import { Input, TextArea } from '../components/ui/Input'

export const Route = createFileRoute('/bookings')({
  loader: async () => {
    const [bookings, memoirs, rates] = await Promise.all([getBookings(), getMemoirs(), getRates()])
    return { bookings, memoirs, rates }
  },
  component: MyBookings,
})

function MyBookings() {
  const router = useRouter()
  const { currentUser, viewerTier } = useTier()
  const { bookings: allBookings, memoirs: allMemoirs, rates } = Route.useLoaderData()

  const bookings = allBookings.filter(b => b.profile_id === currentUser.id)
  const memoirs = allMemoirs.filter(m => m.profile_id === currentUser.id)
  const today = new Date().toISOString().split('T')[0]
  const upcoming = bookings.filter(b => b.end_date >= today && b.status !== 'cancelled')
  const past = bookings.filter(b => b.end_date < today || b.status === 'cancelled')

  // Profile edit
  const [editMode, setEditMode] = useState(false)
  const [formName, setFormName] = useState(currentUser.name)
  const [formEmail, setFormEmail] = useState(currentUser.email)
  const [formEC, setFormEC] = useState(currentUser.emergency_contact_name ?? '')
  const [formPhone, setFormPhone] = useState(currentUser.emergency_contact_phone ?? '')

  async function handleSavePrefs() {
    await updateProfile(currentUser.id, {
      name: formName,
      email: formEmail,
      emergency_contact_name: formEC || null,
      emergency_contact_phone: formPhone || null,
    })
    await router.invalidate()
    setEditMode(false)
  }

  // New booking modal
  const [showNewBooking, setShowNewBooking] = useState(false)
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [guests, setGuests] = useState(2)
  const [hostNote, setHostNote] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [bookingDone, setBookingDone] = useState(false)

  const isFree = viewerTier === 'family' || viewerTier === 'friends'
  const nightlyRate = viewerTier === 'family' ? 0
    : Number(rates.find(r => r.tier === viewerTier)?.nightly_rate ?? 0)

  const nights = useMemo(() => {
    if (!arrival || !departure) return 0
    const s = new Date(arrival), e = new Date(departure)
    return e > s ? Math.round((e.getTime() - s.getTime()) / 86400000) : 0
  }, [arrival, departure])

  function openNewBooking() {
    setArrival(''); setDeparture(''); setGuests(2); setHostNote('')
    setBookingError(''); setBookingDone(false)
    setShowNewBooking(true)
  }

  async function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!arrival || !departure) { setBookingError('Please select arrival and departure dates.'); return }
    if (nights <= 0) { setBookingError('Departure must be after arrival.'); return }
    setBookingError('')

    await createBooking({
      profile_id: currentUser.id,
      start_date: arrival,
      end_date: departure,
      guest_adults: guests,
      guest_children: 0,
      host_note: hostNote || null,
      status: 'pending',
      tier_at_booking: viewerTier,
      title: `${currentUser.name.split(' ')[0]}'s ${new Date(arrival).toLocaleDateString('en-US', { month: 'long' })} Stay`,
    })
    await router.invalidate()
    setBookingDone(true)
    setTimeout(() => setShowNewBooking(false), 1800)
  }

  const nightsBooked = bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => {
    const s = new Date(b.start_date), e = new Date(b.end_date)
    return sum + Math.round((e.getTime() - s.getTime()) / 86400000)
  }, 0)

  return (
    <div className="max-w-[1280px] mx-auto px-5 md:px-[80px] py-[64px]">
      <h1 className="font-literata font-bold text-[48px] leading-tight text-on-surface mb-8">My Bookings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-[40px] items-start">
        {/* Main content */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-literata font-semibold text-[28px] text-on-surface">
              Upcoming Stays
              <span className="font-manrope font-normal text-base text-outline ml-3">
                {upcoming.length} reservation{upcoming.length !== 1 ? 's' : ''}
              </span>
            </h2>
          </div>

          <div className="space-y-4">
            {upcoming.length === 0 && (
              <Card>
                <div className="text-center py-4">
                  <p className="font-manrope text-outline mb-3">No upcoming stays.</p>
                  <Button size="sm" onClick={openNewBooking}>Book Stay</Button>
                </div>
              </Card>
            )}
            {upcoming.map(booking => (
              <BookingCard key={booking.id} booking={booking} showActions />
            ))}
          </div>

          <Button variant="secondary" size="md" className="mt-6" onClick={openNewBooking}>
            + New Reservation
          </Button>

          <div className="flex items-center justify-between mt-[64px] mb-6">
            <h2 className="font-literata font-semibold text-[28px] text-on-surface">Past Memories</h2>
            <span className="font-manrope text-sm text-outline">{nightsBooked} Total Nights</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memoirs.length === 0 && (
              <Card className="col-span-2">
                <p className="font-manrope text-outline text-center py-4">No memories recorded yet.</p>
              </Card>
            )}
            {memoirs.map(memoir => (
              <Card key={memoir.id} className="hover:border-primary/30 transition-colors cursor-pointer">
                <p className="font-manrope text-xs text-outline uppercase tracking-wider mb-1">
                  {new Date(memoir.memoir_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                </p>
                <h3 className="font-literata font-semibold text-xl text-on-surface mb-2">{memoir.title}</h3>
                <p className="font-manrope text-sm text-on-surface-variant leading-relaxed">{memoir.body}</p>
                <div className="mt-4 flex items-center gap-4">
                  <button className="text-sm font-manrope font-semibold text-primary hover:underline">Read Full Memory</button>
                  <span className="text-sm font-manrope text-outline">View Photos ({memoir.photo_count})</span>
                </div>
              </Card>
            ))}
          </div>

          {past.length > 0 && (
            <>
              <h3 className="font-literata font-semibold text-xl text-on-surface mt-[40px] mb-4">Past Stays</h3>
              <div className="space-y-3">
                {past.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Profile sidebar — right */}
        <aside className="sticky top-24">
          <Card>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center">
                <span className="font-literata font-bold text-2xl text-on-primary-container">
                  {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div>
                <p className="font-literata font-semibold text-xl text-on-surface">{currentUser.name}</p>
                <p className="font-manrope text-sm text-outline mt-0.5">
                  Member since {new Date(currentUser.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <Chip
                  label={currentUser.tier.charAt(0).toUpperCase() + currentUser.tier.slice(1)}
                  variant={currentUser.tier}
                  className="mt-2"
                />
              </div>
            </div>

            <hr className="border-outline-variant my-4" />

            {!editMode ? (
              <div className="space-y-3">
                <InfoRow label="Email Address" value={currentUser.email} />
                {currentUser.emergency_contact_name && (
                  <InfoRow
                    label="Emergency Contact"
                    value={`${currentUser.emergency_contact_name} · ${currentUser.emergency_contact_phone}`}
                  />
                )}
                <Button variant="secondary" size="sm" className="w-full mt-2" onClick={() => setEditMode(true)}>
                  Edit My Profile
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Input label="Name" value={formName} onChange={e => setFormName(e.target.value)} />
                <Input label="Email" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                <Input label="Emergency Contact" value={formEC} onChange={e => setFormEC(e.target.value)} placeholder="Name" />
                <Input label="Phone" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="+1 (555) ..." />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleSavePrefs} className="flex-1">Save</Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditMode(false)} className="flex-1">Cancel</Button>
                </div>
              </div>
            )}

            {upcoming[0]?.host_note && !editMode && (
              <div className="mt-4 p-3 bg-surface-container-low rounded border border-outline-variant">
                <p className="text-xs font-manrope font-semibold text-outline uppercase tracking-wider mb-1">Next Stay Note</p>
                <p className="text-sm font-manrope text-on-surface-variant">{upcoming[0].host_note}</p>
              </div>
            )}
          </Card>
        </aside>
      </div>

      {/* New Booking Modal */}
      {showNewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowNewBooking(false)}
          />
          <div className="relative bg-surface-container-lowest rounded-xl card-shadow w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
            {bookingDone ? (
              <div className="text-center py-8">
                <span className="text-4xl block mb-4">🏡</span>
                <h2 className="font-literata font-semibold text-2xl text-on-surface">Booking Submitted!</h2>
                <p className="font-manrope text-sm text-outline mt-2">Your reservation is pending confirmation.</p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="font-literata font-semibold text-2xl text-on-surface">Reserve Your Stay</h2>
                    <p className="font-manrope text-sm text-outline mt-0.5">Select your dates and confirm below.</p>
                  </div>
                  <button
                    onClick={() => setShowNewBooking(false)}
                    className="text-outline hover:text-on-surface transition-colors text-xl leading-none p-1"
                  >✕</button>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Arrival"
                      type="date"
                      value={arrival}
                      onChange={e => setArrival(e.target.value)}
                    />
                    <Input
                      label="Departure"
                      type="date"
                      value={departure}
                      min={arrival}
                      onChange={e => setDeparture(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-manrope font-semibold text-on-surface-variant block mb-1.5">
                      Guests
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setGuests(g => Math.max(1, g - 1))}
                        className="w-9 h-9 rounded border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
                      >−</button>
                      <span className="font-manrope font-semibold text-on-surface w-20 text-center">
                        {guests} Guest{guests !== 1 ? 's' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => setGuests(g => g + 1)}
                        className="w-9 h-9 rounded border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
                      >+</button>
                    </div>
                  </div>

                  <TextArea
                    label="Note for the Host (Optional)"
                    placeholder="Any special requests or details…"
                    rows={3}
                    value={hostNote}
                    onChange={e => setHostNote(e.target.value)}
                  />

                  {/* Pricing */}
                  <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant space-y-2">
                    <div className="flex justify-between font-manrope text-sm">
                      <span className="text-on-surface-variant">Contribution Type</span>
                      <span className="text-on-surface font-semibold">
                        {isFree ? 'Family & Friends' : 'Public Guest'}
                      </span>
                    </div>
                    {!isFree && nights > 0 && (
                      <div className="flex justify-between font-manrope text-sm">
                        <span className="text-on-surface-variant">{nights} nights × ${nightlyRate}</span>
                        <span className="text-on-surface font-semibold">${(nights * nightlyRate).toFixed(2)}</span>
                      </div>
                    )}
                    <hr className="border-outline-variant" />
                    <div className="flex items-end justify-between">
                      <span className="font-manrope font-semibold text-on-surface">
                        Stay Total
                        {isFree && <span className="block text-xs font-normal text-secondary">Maintenance fee waived</span>}
                      </span>
                      <span className="font-literata font-bold text-2xl text-on-surface">
                        ${(isFree ? 0 : nights * nightlyRate).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {bookingError && (
                    <p className="text-sm text-error font-manrope">{bookingError}</p>
                  )}

                  <Button type="submit" size="lg" className="w-full">
                    Confirm Booking
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-manrope font-semibold text-outline uppercase tracking-wider">{label}</p>
      <p className="text-sm font-manrope text-on-surface mt-0.5">{value}</p>
    </div>
  )
}

function BookingCard({ booking, showActions }: { booking: any; showActions?: boolean }) {
  const nights = Math.round(
    (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / 86400000
  )
  const guestStr = `${booking.guest_adults} Adult${booking.guest_adults !== 1 ? 's' : ''}${booking.guest_children ? `, ${booking.guest_children} Children` : ''}`

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg card-shadow overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div
          className="w-full md:w-48 h-32 md:h-auto bg-cover bg-center shrink-0 rounded-t-lg md:rounded-l-lg md:rounded-t-none"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=70')` }}
        />
        <div className="p-5 flex flex-col gap-2 flex-1">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-manrope text-xs text-outline uppercase tracking-wider">
                {booking.start_date} — {booking.end_date}
              </p>
              <h3 className="font-literata font-semibold text-xl text-on-surface mt-0.5">{booking.title}</h3>
              <p className="font-manrope text-sm text-outline">{guestStr}, {nights} nights</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>
          {showActions && (
            <div className="flex gap-2 mt-2">
              <Button variant="ghost" size="sm">Modify</Button>
              <Button variant="ghost" size="sm">Add Note</Button>
              <Button variant="danger" size="sm">Cancel</Button>
            </div>
          )}
          {!showActions && (
            <button className="text-sm font-manrope font-semibold text-primary hover:underline self-start mt-1">
              Add Memory
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
