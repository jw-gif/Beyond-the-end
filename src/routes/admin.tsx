import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useMemo } from 'react'
import { useTier } from '../lib/context/TierContext'
import {
  getBookings, getProfiles, updateProfileTier,
  getRates, updateRate, addAdminBlock, getAdminBlocks, removeAdminBlock,
  getProfile, getTotalNightsBooked, getCabinRevenue
} from '../lib/data/store'
import { Card } from '../components/ui/Card'
import { Chip, StatusBadge } from '../components/ui/Chip'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import type { Tier } from '../lib/types'

export const Route = createFileRoute('/admin')({ component: AdminDashboard })

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['S','M','T','W','T','F','S']

function AdminDashboard() {
  const { viewerTier } = useTier()

  if (viewerTier !== 'family') {
    return (
      <div className="max-w-[1280px] mx-auto px-5 md:px-[80px] py-[64px] text-center">
        <h2 className="font-literata font-semibold text-2xl text-on-surface mb-2">Access Restricted</h2>
        <p className="font-manrope text-on-surface-variant">The Admin dashboard is only available to Family tier members.</p>
      </div>
    )
  }

  return <AdminContent />
}

function AdminContent() {
  const [bookings, setBookings] = useState(() => getBookings())
  const [profiles, setProfiles] = useState(() => getProfiles())
  const [rates, setRates] = useState(() => getRates())
  const [adminBlocks, setAdminBlocks] = useState(() => getAdminBlocks())

  const [publicRate, setPublicRate] = useState(() => rates.find(r => r.tier === 'public')?.nightly_rate ?? 250)
  const [friendsRate, setFriendsRate] = useState(() => rates.find(r => r.tier === 'friends')?.nightly_rate ?? 150)
  const [ratesSaved, setRatesSaved] = useState(false)

  const [calYear, setCalYear] = useState(2024)
  const [calMonth, setCalMonth] = useState(9)
  const [blockStart, setBlockStart] = useState('')
  const [blockEnd, setBlockEnd] = useState('')
  const [blockReason, setBlockReason] = useState('')

  const [userSearch, setUserSearch] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const upcomingBookings = bookings
    .filter(b => b.end_date >= today && b.status !== 'cancelled')
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  const totalNights = getTotalNightsBooked()
  const revenue = getCabinRevenue()

  function handleSaveRates() {
    updateRate('public', publicRate)
    updateRate('friends', friendsRate)
    setRates([...getRates()])
    setRatesSaved(true)
    setTimeout(() => setRatesSaved(false), 2000)
  }

  function handleTierChange(profileId: string, tier: Tier) {
    updateProfileTier(profileId, tier)
    setProfiles([...getProfiles()])
  }

  function handleAddBlock(e: React.FormEvent) {
    e.preventDefault()
    if (!blockStart || !blockEnd) return
    addAdminBlock({ start_date: blockStart, end_date: blockEnd, reason: blockReason || 'Admin Block' })
    setAdminBlocks([...getAdminBlocks()])
    setBlockStart(''); setBlockEnd(''); setBlockReason('')
  }

  function handleRemoveBlock(id: string) {
    removeAdminBlock(id)
    setAdminBlocks([...getAdminBlocks()])
  }

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    p.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const calDateMap = useMemo(() => {
    const map: Record<string, 'family' | 'friends' | 'block' | 'your'> = {}
    for (const b of bookings) {
      if (b.status === 'cancelled') continue
      const s = new Date(b.start_date), e = new Date(b.end_date)
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0]
        map[key] = b.tier_at_booking === 'family' ? 'family' : 'friends'
      }
    }
    for (const bl of adminBlocks) {
      const s = new Date(bl.start_date), e = new Date(bl.end_date)
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        map[d.toISOString().split('T')[0]] = 'block'
      }
    }
    return map
  }, [bookings, adminBlocks])

  function getCellClass(day: number) {
    const key = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const type = calDateMap[key]
    if (type === 'family') return 'bg-primary text-on-primary rounded-full'
    if (type === 'friends') return 'bg-primary-fixed text-on-primary-fixed rounded-full'
    if (type === 'block') return 'bg-surface-container-highest text-on-surface-variant rounded-full'
    return ''
  }

  return (
    <div className="max-w-[1280px] mx-auto px-5 md:px-[80px] py-[64px]">
      <h1 className="font-literata font-bold text-[48px] leading-tight text-on-surface mb-1">Admin Dashboard</h1>
      <p className="font-manrope text-outline text-base mb-[40px]">Overseeing the legacy of the woods.</p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 mb-6">
        <Card>
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-literata font-semibold text-[24px] text-on-surface">Upcoming Stay Activity</h2>
            <button className="text-sm font-manrope font-semibold text-primary hover:underline">View Full Log →</button>
          </div>
          <p className="font-manrope text-sm text-outline mb-4">Real-time overview of current and pending bookings.</p>

          <div className="space-y-3">
            {upcomingBookings.map(booking => {
              const profile = getProfile(booking.profile_id)
              const nights = Math.round(
                (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / 86400000
              )
              const rate = booking.tier_at_booking === 'family' ? 0
                : rates.find(r => r.tier === booking.tier_at_booking)?.nightly_rate ?? 0
              const cost = nights * rate

              return (
                <div key={booking.id} className="flex items-center gap-4 p-3 bg-surface-container-low rounded-lg border border-outline-variant">
                  <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-on-primary-container">
                      {profile?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-manrope font-semibold text-sm text-on-surface truncate">
                      {profile?.name} & Family
                    </p>
                    <p className="font-manrope text-xs text-outline">
                      {booking.start_date} · {booking.guest_adults + booking.guest_children} Guests · {booking.tier_at_booking.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-manrope font-bold text-sm text-on-surface">${cost.toFixed(2)}</p>
                    <StatusBadge status={booking.status} />
                  </div>
                </div>
              )
            })}

            {adminBlocks.map(block => (
              <div key={block.id} className="flex items-center gap-4 p-3 bg-surface-container-highest rounded-lg border border-outline-variant">
                <div className="w-9 h-9 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center shrink-0">
                  <span className="text-base">🔧</span>
                </div>
                <div className="flex-1">
                  <p className="font-manrope font-semibold text-sm text-on-surface">{block.reason}</p>
                  <p className="font-manrope text-xs text-outline">{block.start_date} · Admin Block</p>
                </div>
                <Chip label="Maintenance" variant="maintenance" />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-literata font-semibold text-[24px] text-on-surface mb-1">Rate Management</h2>
          <p className="font-manrope text-sm text-outline mb-5">Set nightly rates for non-family guests.</p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-manrope font-semibold text-on-surface-variant block mb-1.5">
                Public Nightly Rate
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-manrope text-outline">$</span>
                <input
                  type="number"
                  value={publicRate}
                  onChange={e => setPublicRate(Number(e.target.value))}
                  className="w-full pl-7 pr-4 py-2.5 rounded border border-outline-variant bg-surface-container-lowest font-manrope text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-manrope font-semibold text-on-surface-variant block mb-1.5">
                Family & Kin Rate (Discount)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-manrope text-outline">$</span>
                <input
                  type="number"
                  value={friendsRate}
                  onChange={e => setFriendsRate(Number(e.target.value))}
                  className="w-full pl-7 pr-4 py-2.5 rounded border border-outline-variant bg-surface-container-lowest font-manrope text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveRates} className="w-full mt-6">
            {ratesSaved ? '✓ Saved!' : 'Save Rate Changes'}
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 mb-6">
        <Card>
          <h2 className="font-literata font-semibold text-[24px] text-on-surface mb-1">Calendar Controls</h2>
          <p className="font-manrope text-sm text-outline mb-4">Select dates to block for maintenance or family use.</p>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1) } else setCalMonth(m => m-1) }}
                className="text-outline hover:text-on-surface p-1">←</button>
              <span className="font-literata font-semibold text-sm text-on-surface">
                {MONTHS[calMonth]} {calYear}
              </span>
              <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1) } else setCalMonth(m => m+1) }}
                className="text-outline hover:text-on-surface p-1">→</button>
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {DAYS.map((d, i) => (
                <div key={`${d}-${i}`} className="text-center text-xs font-manrope text-outline py-1">{d}</div>
              ))}
              {cells.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} />
                const cls = getCellClass(day)
                return (
                  <div key={day} className={[
                    'text-center text-xs font-manrope py-1.5 cursor-pointer hover:bg-surface-container rounded-full transition-colors',
                    cls,
                  ].join(' ')}>
                    {day}
                  </div>
                )
              })}
            </div>
            <div className="mt-3 space-y-1.5">
              {[
                { color: 'bg-primary', label: 'Family & Confirmed' },
                { color: 'bg-primary-fixed', label: 'Friends & Pending' },
                { color: 'bg-surface-container-highest border border-outline-variant', label: 'Admin Block / Maintenance' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${item.color} shrink-0`} />
                  <span className="font-manrope text-xs text-on-surface-variant">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddBlock} className="space-y-3 border-t border-outline-variant pt-4">
            <p className="font-manrope text-xs font-semibold text-outline uppercase tracking-wider">Add Date Block</p>
            <div className="grid grid-cols-2 gap-2">
              <Input label="Start" type="date" value={blockStart} onChange={e => setBlockStart(e.target.value)} />
              <Input label="End" type="date" value={blockEnd} min={blockStart} onChange={e => setBlockEnd(e.target.value)} />
            </div>
            <Input label="Reason" value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="e.g. Winterization" />
            <Button type="submit" variant="secondary" size="sm" className="w-full">Block Dates</Button>
          </form>

          {adminBlocks.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-outline-variant pt-3">
              {adminBlocks.map(b => (
                <div key={b.id} className="flex items-center justify-between text-xs font-manrope">
                  <span className="text-on-surface-variant">{b.start_date} – {b.end_date}: {b.reason}</span>
                  <button onClick={() => handleRemoveBlock(b.id)} className="text-error hover:underline ml-2">Remove</button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-literata font-semibold text-[24px] text-on-surface mb-4">User Management</h2>

          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline">🔍</span>
            <input
              type="text"
              placeholder="Search…"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded border border-outline-variant bg-surface-container-lowest font-manrope text-sm text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="border border-outline-variant rounded-lg overflow-hidden">
            <table className="w-full text-sm font-manrope">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="text-left px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Member</th>
                  <th className="text-left px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Assigned Tier</th>
                  <th className="text-left px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Last Active</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredProfiles.map(profile => (
                  <UserRow
                    key={profile.id}
                    profile={profile}
                    onTierChange={handleTierChange}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <button className="mt-4 font-manrope text-sm font-semibold text-primary hover:underline">
            + Invite New Member
          </button>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          label="Total Nights Booked"
          value={totalNights.toString()}
          subValue="+27% vs LY"
          positive
        />
        <KpiCard
          label="Cabin Revenue"
          value={`$${revenue.toLocaleString()}`}
          subValue="Reserved for maintenance"
        />
        <KpiCard
          label="Maintenance Score"
          value="Good"
          subValue="Last: Winterization"
          isGood
        />
      </div>
    </div>
  )
}

function UserRow({ profile, onTierChange }: { profile: any; onTierChange: (id: string, tier: Tier) => void }) {
  const lastActive = ['2 days ago', '3 weeks ago', 'Never', '1 week ago', '2 months ago', '5 days ago'][
    Math.abs(profile.id.charCodeAt(8) - 48) % 6
  ]

  return (
    <tr className="hover:bg-surface-container-low transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-on-secondary-container">
              {profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <span className="font-semibold text-on-surface">{profile.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <select
          value={profile.tier}
          onChange={e => onTierChange(profile.id, e.target.value as Tier)}
          className="text-sm font-manrope font-semibold text-primary bg-transparent border border-outline-variant rounded px-2 py-1 focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="family">Family</option>
          <option value="friends">Friends</option>
          <option value="public">Public</option>
        </select>
      </td>
      <td className="px-4 py-3 text-on-surface-variant text-sm">{lastActive}</td>
      <td className="px-4 py-3">
        <button className="text-outline hover:text-on-surface transition-colors">⋯</button>
      </td>
    </tr>
  )
}

function KpiCard({ label, value, subValue, positive, isGood }: {
  label: string; value: string; subValue?: string; positive?: boolean; isGood?: boolean
}) {
  return (
    <Card className="bg-surface-container-low">
      <p className="font-manrope text-xs text-outline uppercase tracking-wider mb-1">{label}</p>
      <p className={[
        'font-literata font-bold text-3xl mt-1',
        isGood ? 'text-secondary' : 'text-on-surface',
      ].join(' ')}>
        {value}
        {positive && <span className="font-manrope text-sm text-secondary ml-2">↑{subValue}</span>}
      </p>
      {subValue && !positive && (
        <p className="font-manrope text-xs text-outline mt-1">{subValue}</p>
      )}
    </Card>
  )
}
