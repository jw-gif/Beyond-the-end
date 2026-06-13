import React from 'react'

type ChipVariant = 'confirmed' | 'pending' | 'cancelled' | 'family' | 'friends' | 'public' | 'maintenance' | 'default'

interface ChipProps {
  label: string
  variant?: ChipVariant
  className?: string
}

const variantClasses: Record<ChipVariant, string> = {
  confirmed: 'bg-secondary-container text-on-secondary-container',
  pending: 'bg-primary-fixed text-on-primary-fixed',
  cancelled: 'bg-error-container text-on-error-container',
  family: 'bg-secondary-container text-on-secondary-container',
  friends: 'bg-surface-container-high text-on-surface-variant',
  public: 'bg-tertiary-container text-on-tertiary-container',
  maintenance: 'bg-surface-container-highest text-on-surface-variant',
  default: 'bg-surface-container text-on-surface-variant',
}

export function Chip({ label, variant = 'default', className = '' }: ChipProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-manrope font-semibold tracking-wide uppercase',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {label}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, ChipVariant> = {
    confirmed: 'confirmed',
    pending: 'pending',
    cancelled: 'cancelled',
  }
  const labels: Record<string, string> = {
    confirmed: 'Confirmed',
    pending: 'Pending',
    cancelled: 'Cancelled',
  }
  return <Chip label={labels[status] ?? status} variant={map[status] ?? 'default'} />
}
