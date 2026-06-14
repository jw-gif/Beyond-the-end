import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import React, { useState } from 'react'
import { useTier } from '../lib/context/TierContext'
import { getBookings, getMemoirs, updateProfile } from '../lib/data/store'
import { Card } from '../components/ui/Card'
import { Chip, StatusBadge } from '../components/ui/Chip'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export const Route = createFileRoute('/bookings')({
  loader: async () => {
    const [bookings, memoirs] = await Promise.all([getBookings(), getMemoirs()])
    return { bookings, memoirs }
  },
  component: MyBookings,
})

function MyBookings() {
  const router = useRouter()
  const { currentUser, viewerTier } = useTier()
  const { bookings: allBookings, memoirs: allMemoirs } = Route.useLoaderData()

  const bookings = allBookings.filter(b => b.profile_id === currentUser.id)
  const memoirs = allMemoirs.filter(m => m.profile_id === currentUser.id)
  const today = new Date().toISOString().split('T')[0]
  const upcoming = bookings.filter(b => b.end_date >= today && b.status !== 'cancelled')
  const past = bookings.filter(b => b.end_date < today || b.status === 'cancelled')

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

  const nightsBooked = bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => {
    const s = new Date(b.start_date), e = new Date(b.end_date)
    return sum + Math.round((e.getTime() - s.getTime()) / 86400000)
  }, 0)

  return (
    <div className="max-w-[1280px] mx-auto px-5 md:px-[80px] py-[64px]">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-[40px]">
        <aside className="flex flex-col gap-6">
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
                  Update Guest Preferences
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

            {currentUser.emergency_contact_name && !editMode && (
              <div className="mt-4 p-3 bg-surface-container-low rounded border border-outline-variant">
                <p className="text-xs font-manrope font-semibold text-outline uppercase tracking-wider mb-1">Host Note</p>
                <p className="text-sm font-manrope text-on-surface-variant">
                  {upcoming[0]?.host_note ?? 'No host note for upcoming stay.'}
                </p>
              </div>
            )}
          </Card>
        </aside>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-literata font-semibold text-[32px] text-on-surface">Upcoming Stays</h2>
            <span className="font-manrope text-sm text-outline">{upcoming.length} Reservation{upcoming.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="space-y-4">
            {upcoming.length === 0 && (
              <Card>
                <p className="font-manrope text-outline text-center py-4">No upcoming stays. <Link to="/bookings/new" className="text-primary font-semibold underline">Book now</Link></p>
              </Card>
            )}
            {upcoming.map(booking => (
              <BookingCard key={booking.id} booking={booking} showActions />
            ))}
          </div>

          <Link to="/bookings/new">
            <Button variant="secondary" size="md" className="mt-6">+ New Reservation</Button>
          </Link>

          <div className="flex items-center justify-between mt-[64px] mb-6">
            <h2 className="font-literata font-semibold text-[32px] text-on-surface">Past Memoirs</h2>
            <span className="font-manrope text-sm text-outline">{nightsBooked} Total Stays</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memoirs.length === 0 && (
              <Card className="col-span-2">
                <p className="font-manrope text-outline text-center py-4">No memoirs yet.</p>
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
                  <button className="text-sm font-manrope font-semibold text-primary hover:underline">Read Full Memoir</button>
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
      </div>
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
      <div className="flex flex-col md:flex-row gap-0">
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
              Add Full Memoir
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
