import { createFileRoute } from '@tanstack/react-router'
import React, { useState } from 'react'
import { useTier } from '../lib/context/TierContext'
import {
  getCoopItems, claimCoopItem, unclaimCoopItem,
  getGuestNotes, addGuestNote,
  getInventory, getProfile
} from '../lib/data/store'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, TextArea } from '../components/ui/Input'

export const Route = createFileRoute('/coop')({ component: CoopHub })

function CoopHub() {
  const { currentUser } = useTier()
  const [coopItems, setCoopItems] = useState(() => getCoopItems())
  const [guestNotes, setGuestNotes] = useState(() => getGuestNotes())
  const inventory = getInventory()

  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [showNoteForm, setShowNoteForm] = useState(false)

  function handleClaim(itemId: string) {
    const item = coopItems.find(i => i.id === itemId)
    if (!item) return
    if (item.claimed_by === currentUser.id) {
      unclaimCoopItem(itemId)
    } else {
      claimCoopItem(itemId, currentUser.id)
    }
    setCoopItems([...getCoopItems()])
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteTitle.trim() || !noteBody.trim()) return
    addGuestNote({
      author_name: currentUser.name,
      title: noteTitle,
      body: noteBody,
      note_date: new Date().toISOString().split('T')[0],
    })
    setGuestNotes([...getGuestNotes()])
    setNoteTitle('')
    setNoteBody('')
    setShowNoteForm(false)
  }

  return (
    <div>
      <div className="max-w-[1280px] mx-auto px-5 md:px-[80px] pt-[64px]">
        <p className="font-manrope text-sm text-outline uppercase tracking-wider mb-1">Co-op</p>
        <h1 className="font-literata font-bold text-[48px] leading-tight tracking-tight text-on-surface max-w-2xl">
          A communal space for those who share the cabin.
        </h1>
        <p className="font-manrope text-on-surface-variant text-base mt-3 max-w-2xl">
          Claim a supply item, browse the standing inventory, and leave important guest notes for those who come after you.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-[40px] mt-[40px]">
          <div className="space-y-[40px]">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-literata font-semibold text-[24px] text-on-surface">Claim-an-Item</h2>
                <Button variant="secondary" size="sm">+ Add Item</Button>
              </div>
              <Card padding="sm" className="divide-y divide-outline-variant">
                {coopItems.map(item => {
                  const claimedProfile = item.claimed_by ? getProfile(item.claimed_by) : null
                  const isMine = item.claimed_by === currentUser.id
                  const isClaimed = !!item.claimed_by

                  return (
                    <div key={item.id} className="flex items-center justify-between gap-4 p-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={[
                          'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                          isClaimed ? 'bg-primary border-primary' : 'border-outline-variant',
                        ].join(' ')}>
                          {isClaimed && <span className="text-white text-xs">✓</span>}
                        </div>
                        <div>
                          <p className={[
                            'font-manrope font-semibold text-sm',
                            isClaimed ? 'line-through text-outline' : 'text-on-surface',
                          ].join(' ')}>
                            {item.label}
                          </p>
                          {item.subtitle && (
                            <p className="font-manrope text-xs text-outline mt-0.5">
                              {isClaimed ? `Claimed by ${claimedProfile?.name ?? 'someone'}` : item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleClaim(item.id)}
                        className={[
                          'shrink-0 px-3 py-1.5 rounded text-xs font-manrope font-semibold transition-colors',
                          isMine
                            ? 'bg-error-container text-on-error-container hover:opacity-80'
                            : isClaimed
                            ? 'bg-surface-container text-on-surface-variant opacity-60 cursor-not-allowed'
                            : 'bg-secondary-container text-on-secondary-container hover:bg-secondary/20',
                        ].join(' ')}
                        disabled={isClaimed && !isMine}
                      >
                        {isMine ? 'Unclaim' : isClaimed ? 'Claimed' : 'Claim'}
                      </button>
                    </div>
                  )
                })}
              </Card>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-literata font-semibold text-[24px] text-on-surface">Guest Notes</h2>
                <Button variant="secondary" size="sm" onClick={() => setShowNoteForm(v => !v)}>
                  {showNoteForm ? 'Cancel' : '+ Add Note'}
                </Button>
              </div>

              {showNoteForm && (
                <Card className="mb-4 bg-surface-container-low">
                  <form onSubmit={handleAddNote} className="space-y-3">
                    <Input label="Title" value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="e.g. Propane is Low" />
                    <TextArea label="Note" rows={3} value={noteBody} onChange={e => setNoteBody(e.target.value)} placeholder="Leave an important update for the next guests…" />
                    <Button type="submit" size="sm">Post Note</Button>
                  </form>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guestNotes.map(note => (
                  <Card key={note.id}>
                    <p className="font-manrope text-xs text-outline uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>{note.author_name}</span>
                      <span>{new Date(note.note_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </p>
                    <h3 className="font-literata font-semibold text-lg text-on-surface mb-2">{note.title}</h3>
                    <p className="font-manrope text-sm text-on-surface-variant leading-relaxed">{note.body}</p>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          <aside>
            <h2 className="font-literata font-semibold text-[24px] text-on-surface mb-4">
              📦 Inventory
            </h2>
            <Card padding="sm">
              <p className="font-manrope text-xs text-outline uppercase tracking-wider px-4 pt-2 pb-3">
                Standing Staples — always maintained at the cabin
              </p>
              <div className="divide-y divide-outline-variant">
                {inventory.map(item => (
                  <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <div>
                      <p className="font-manrope font-semibold text-sm text-on-surface">{item.label}</p>
                      <p className="font-manrope text-xs text-outline">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="font-manrope text-xs text-outline px-4 py-3 border-t border-outline-variant">
                See Full Inventory →
              </p>
            </Card>
          </aside>
        </div>
      </div>

      <div className="relative mt-[64px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=70')` }}
        />
        <div className="absolute inset-0 bg-primary/70" />
        <div className="relative max-w-[1280px] mx-auto px-5 md:px-[80px] py-[64px] text-center">
          <h2 className="font-literata font-bold text-[48px] text-white leading-tight">
            Leave it better than you found it.
          </h2>
          <p className="font-manrope text-white/70 text-lg mt-3">
            Every gesture of care makes the cabin a gift for the next generation.
          </p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-5 md:px-[80px] py-8">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {['Pending & Upcoming', 'Guest Memoirs'].map(label => (
            <button key={label} className="font-manrope text-sm text-outline hover:text-on-surface transition-colors">
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
