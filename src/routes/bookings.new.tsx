import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import React, { useState, useMemo } from 'react'
import { useTier } from '../lib/context/TierContext'
import { getRates, createBooking } from '../lib/data/store'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, TextArea } from '../components/ui/Input'

export const Route = createFileRoute('/bookings/new')({
  loader: async () => {
    const rates = await getRates()
    return { rates }
  },
  component: BookingNew,
})

function BookingNew() {
  const { viewerTier, currentUser } = useTier()
  const { rates } = Route.useLoaderData()
  const navigate = useNavigate()

  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [guests, setGuests] = useState(2)
  const [hostNote, setHostNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const nightlyRate = viewerTier === 'family' ? 0
    : (rates.find(r => r.tier === viewerTier)?.nightly_rate ?? 0)
  const isFree = viewerTier === 'family' || viewerTier === 'friends'

  const nights = useMemo(() => {
    if (!arrival || !departure) return 0
    const s = new Date(arrival), e = new Date(departure)
    if (e <= s) return 0
    return Math.round((e.getTime() - s.getTime()) / 86400000)
  }, [arrival, departure])

  const total = isFree ? 0 : nights * Number(nightlyRate)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!arrival || !departure) { setError('Please select arrival and departure dates.'); return }
    if (nights <= 0) { setError('Departure must be after arrival.'); return }
    setError('')

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
    setSubmitted(true)
    setTimeout(() => navigate({ to: '/bookings' }), 1800)
  }

  if (submitted) {
    return (
      <div className="max-w-[1280px] mx-auto px-5 md:px-[80px] py-[64px] text-center">
        <div className="inline-flex flex-col items-center gap-4 bg-secondary-container text-on-secondary-container rounded-lg p-10 card-shadow">
          <span className="text-4xl">🏡</span>
          <h2 className="font-literata font-semibold text-2xl">Booking Submitted!</h2>
          <p className="font-manrope text-sm">Your reservation is pending confirmation. Redirecting…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1280px] mx-auto px-5 md:px-[80px] py-[64px]">
      <Link to="/bookings" className="inline-flex items-center gap-2 text-sm font-manrope text-outline hover:text-on-surface transition-colors mb-8">
        ← Back to Calendar
      </Link>

      <h1 className="font-literata font-bold text-[48px] leading-tight tracking-tight text-on-surface mb-2">
        Reserve Your Time
      </h1>
      <p className="font-manrope text-on-surface-variant text-base mb-[40px]">
        Secure your dates at the cabin. Remember to check the shared calendar for community maintenance weekends.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-[40px]">
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Arrival Date"
                type="date"
                value={arrival}
                onChange={e => setArrival(e.target.value)}
              />
              <Input
                label="Departure Date"
                type="date"
                value={departure}
                min={arrival}
                onChange={e => setDeparture(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-manrope font-semibold text-on-surface-variant block mb-1.5">
                Number of Guests
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setGuests(g => Math.max(1, g - 1))}
                  className="w-9 h-9 rounded border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors font-bold"
                >
                  −
                </button>
                <span className="font-manrope font-semibold text-on-surface w-8 text-center">{guests} Guests</span>
                <button
                  type="button"
                  onClick={() => setGuests(g => g + 1)}
                  className="w-9 h-9 rounded border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <TextArea
              label="Note for the Host (Optional)"
              placeholder="Any special requests or details about your stay…"
              rows={4}
              value={hostNote}
              onChange={e => setHostNote(e.target.value)}
            />

            <Card className="bg-surface-container-low">
              <h3 className="font-literata font-semibold text-lg text-on-surface mb-3">Pricing Summary</h3>
              <div className="space-y-2">
                <PricingRow
                  label="Contribution Type"
                  value={viewerTier === 'family' ? 'Family & Friends' : viewerTier === 'friends' ? 'Family & Friends' : 'Public Guest'}
                />
                {!isFree && nights > 0 && (
                  <PricingRow label={`${nights} nights × $${nightlyRate}`} value={`$${(nights * Number(nightlyRate)).toFixed(2)}`} />
                )}
                <hr className="border-outline-variant my-2" />
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-manrope font-semibold text-on-surface">Stay Total</p>
                    {isFree && (
                      <p className="font-manrope text-xs text-secondary mt-0.5">Maintenance fee waived</p>
                    )}
                  </div>
                  <p className="font-literata font-bold text-3xl text-on-surface">${total.toFixed(2)}</p>
                </div>
              </div>

              {viewerTier === 'public' && (
                <div className="mt-4 p-4 bg-surface-container-highest border border-outline-variant rounded">
                  <p className="font-manrope text-sm text-on-surface-variant">
                    💳 Payment integration coming soon (Stripe). For now, bookings are submitted for review.
                  </p>
                  <div className="mt-3 p-3 border-2 border-dashed border-outline rounded opacity-40 text-center text-xs font-manrope text-outline">
                    [Stripe Payment Element]
                  </div>
                  <Button type="submit" className="w-full mt-3" disabled>Payment Required</Button>
                </div>
              )}
            </Card>

            {error && <p className="text-sm text-error font-manrope">{error}</p>}

            {viewerTier !== 'public' && (
              <Button type="submit" size="lg" className="w-full">
                Confirm Booking
              </Button>
            )}
          </form>
        </div>

        <div className="space-y-5">
          <Card>
            <div
              className="h-40 rounded-lg bg-cover bg-center mb-4"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=600&q=70')` }}
            />
            <h3 className="font-literata font-semibold text-xl text-on-surface">The Main Lodge</h3>
            <p className="font-manrope text-sm text-outline mt-1">3 Bedrooms · 2 Baths</p>
            <div className="mt-3 space-y-2">
              <AmenityRow label="Kitchen fully stocked with cookware" />
              <AmenityRow label="Linens and towels are provided by the collective" />
              <AmenityRow label="Firewood is available on site" />
            </div>
          </Card>

          <Card className="bg-primary-container text-on-primary-container">
            <h3 className="font-literata font-semibold text-lg mb-3">🌲 Cabin Etiquette</h3>
            <ul className="space-y-2">
              {[
                'Restock what you use from the pantry.',
                'Quiet hours: 10:00 PM to 8:00 AM.',
                'Check-out by 11:00 AM on departure day.',
                'Leave a guest note if anything needs attention.',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 font-manrope text-sm text-on-primary-container/90">
                  <span className="mt-0.5 text-on-primary-container/60">•</span>
                  {item}
                </li>
              ))}
            </ul>
            <button className="mt-4 text-sm font-manrope font-semibold underline text-on-primary-container/80 hover:text-on-primary-container">
              Read Guest Memoirs
            </button>
          </Card>
        </div>
      </div>
    </div>
  )
}

function PricingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between font-manrope text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="text-on-surface font-semibold">{value}</span>
    </div>
  )
}

function AmenityRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 font-manrope text-sm text-on-surface-variant">
      <span className="text-secondary">✓</span>
      {label}
    </div>
  )
}
