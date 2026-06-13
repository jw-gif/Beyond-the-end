import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-manrope font-semibold text-on-surface-variant">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full px-4 py-2.5 rounded border border-outline-variant bg-surface-container-lowest',
          'font-manrope text-sm text-on-surface placeholder:text-outline',
          'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10',
          'transition-colors',
          error ? 'border-error' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-error font-manrope">{error}</p>}
    </div>
  )
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function TextArea({ label, error, className = '', id, ...props }: TextAreaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-manrope font-semibold text-on-surface-variant">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={[
          'w-full px-4 py-2.5 rounded border border-outline-variant bg-surface-container-lowest',
          'font-manrope text-sm text-on-surface placeholder:text-outline',
          'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10',
          'transition-colors resize-none',
          error ? 'border-error' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-error font-manrope">{error}</p>}
    </div>
  )
}
