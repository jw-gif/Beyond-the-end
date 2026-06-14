import { createFileRoute, useRouter } from '@tanstack/react-router'
import React, { useState } from 'react'
import { useTier } from '../lib/context/TierContext'
import {
  getCoopItems, claimCoopItem, unclaimCoopItem,
  getGuestNotes, addGuestNote,
  getInventory,
} from '../lib/data/store'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, TextArea } from '../components/ui/Input'

export const Route = createFileRoute('/coop')({
  loader: async () => {
    const [coopItems, guestNotes, inventory] = await Promise.all([
      getCoopItems(),
      getGuestNotes(),
      getInventory(),
    ])
    return { coopItems, guestNotes, inventory }
  },
  component: CoopHub,
})

function CoopHub() {
  const router = useRouter()
  const { currentUser } = useTier()
  const { coopItems, guestNotes, inventory } = Route.useLoaderData()

  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [showNoteForm, setShowNoteForm] = useState(false)

  async function handleClaim(itemId: string) {
    const item = coopItems.find(i => i.id === itemId)
    if (!item) return
    if (item.claimed_by === currentUser.id) {
      await unclaimCoopItem(itemId)
    } else {
      await claimCoopItem(itemId, currentUser.id)
    }
    await router.invalidate()
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteTitle.trim() || !noteBody.trim()) return
    await addGuestNote({
      author_name: currentUser.name,
      title: noteTitle,
      body: noteBody,
      note_date: new Date().toISOString().split('T')[0],
    })
    await router.invalidate()
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
            {/* Claim-an-Item */}
            <section>
              <h2 className="font-literata font-semibold text-[24px] text-on-surface mb-1">Claim-an-Item</h2>
              <p className="font-manrope text-sm text-outline mb-4">
                Help stock the cabin by claiming what you'll bring. Unclaim anytime if plans change.
              </p>
              <div className="space-y-3">
                {coopItems.map(item => {
                  const isMine = item.claimed_by === currentUser.id
                  const isClaimed = Boolean(item.claimed_by)
                  return (
                    <div
                      key={item.id}
                      className={[
                        'flex items-center gap-4 p-4 rounded-lg border transition-colors',
                        isClaimed
                          ? 'bg-surface-container border-outline-variant opacity-70'
                          : 'bg-surface-container-lowest border-outline-variant hover:border-primary/30',
                      ].join(' ')}
                    >
                      <div className={[
                        'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                        isClaimed ? 'bg-primary border-primary' : 'border-outline-variant',
                      ].join(' ')}>
                        {isClaimed && <span className="text-on-primary text-xs font-bold">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={[
                          'font-manrope font-semibold text-sm text-on-surface',
                          isClaimed ? 'line-through text-outline' : '',
                        ].join(' ')}>
                          {item.label}
                        </p>
                        {item.subtitle && (
                          <p className="font-manrope text-xs text-outline mt-0.5">{item.subtitle}</p>
                        )}
                        {isClaimed && !isMine && (
                          <p className="font-manrope text-xs text-secondary mt-0.5">
                            Claimed ✓
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleClaim(item.id)}
                        disabled={isClaimed && !isMine}
                        className={[
                          'shrink-0 px-3 py-1.5 rounded text-xs font-manrope font-semibold transition-colors',
                          isMine
                            ? 'bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-error/10 hover:text-error hover:border-error'
                            : isClaimed
                              ? 'text-outline cursor-not-allowed opacity-50'
                              : 'bg-primary text-on-primary hover:bg-primary/90',
                        ].join(' ')}
                      >
                        {isMine ? 'Unclaim' : isClaimed ? 'Claimed' : 'Claim'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Guest Notes */}
            <section>
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-literata font-semibold text-[24px] text-on-surface">Guest Notes</h2>
                <button
                  onClick={() => setShowNoteForm(v => !v)}
                  className="text-sm font-manrope font-semibold text-primary hover:underline"
                >
                  {showNoteForm ? 'Cancel' : '+ Add Note'}
                </button>
              </div>
              <p className="font-manrope text-sm text-outline mb-4">
                Leave a note for the next guests about anything important.
              </p>

              {showNoteForm && (
                <form onSubmit={handleAddNote} className="mb-5 p-4 bg-surface-container-low rounded-lg border border-outline-variant space-y-3">
                  <Input
                    label="Note Title"
                    placeholder="e.g. Hot water heater needs 5 min"
                    value={noteTitle}
                    onChange={e => setNoteTitle(e.target.value)}
                  />
                  <TextArea
                    label="Details"
                    placeholder="Leave clear, helpful information…"
                    rows={3}
                    value={noteBody}
                    onChange={e => setNoteBody(e.target.value)}
                  />
                  <Button type="submit" size="sm">Post Note</Button>
                </form>
              )}

              <div className="space-y-4">
                {guestNotes.map(note => (
                  <Card key={note.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-manrope text-xs text-outline uppercase tracking-wider mb-1">
                          {new Date(note.note_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {note.author_name}
                        </p>
                        <h3 className="font-literata font-semibold text-lg text-on-surface">{note.title}</h3>
                      </div>
                    </div>
                    <p className="font-manrope text-sm text-on-surface-variant mt-2 leading-relaxed">{note.body}</p>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Standing Inventory sidebar */}
          <aside>
            <div className="sticky top-24">
              <h2 className="font-literata font-semibold text-[20px] text-on-surface mb-1">Standing Inventory</h2>
              <p className="font-manrope text-xs text-outline mb-4">
                Items always stocked at the cabin. You don't need to bring these.
              </p>
              <Card>
                <ul className="space-y-3">
                  {inventory.map(item => (
                    <li key={item.id} className="flex items-start gap-3">
                      <span className="text-lg shrink-0">{item.icon}</span>
                      <div>
                        <p className="font-manrope font-semibold text-sm text-on-surface">{item.label}</p>
                        <p className="font-manrope text-xs text-outline mt-0.5">{item.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </aside>
        </div>
      </div>

      {/* Banner */}
      <div className="relative mt-[64px] h-[200px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40" />
        <div className="absolute inset-0 flex items-center px-5 md:px-[80px]">
          <p className="font-literata font-semibold text-2xl md:text-3xl text-white max-w-lg leading-snug">
            Leave it better than you found it.
          </p>
        </div>
      </div>

      <div className="mt-[64px]" />
    </div>
  )
}
