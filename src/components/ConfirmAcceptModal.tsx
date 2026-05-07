import { useEffect } from 'react'

interface ConfirmAcceptModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
  personName?: string | null
}

export default function ConfirmAcceptModal({
  isOpen, onClose, onConfirm, loading = false, personName,
}: ConfirmAcceptModalProps) {

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <div
      className={`fixed inset-0 z-[80] transition-opacity duration-200 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div onClick={loading ? undefined : onClose} className="absolute inset-0 bg-navy/85 backdrop-blur-md" />

      <div className="relative h-full flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-navy-mid border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

          {/* Hero */}
          <div className="px-6 pt-7 pb-5 text-center bg-gradient-to-br from-emerald-500/10 via-gold/8 to-transparent border-b border-white/5">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-semibold text-cream mb-1">Start a conversation?</h3>
            <p className="text-sm text-cream/55">
              Accepting will start a conversation
              {personName ? <> with <span className="font-medium text-cream">{personName}</span></> : null}.
            </p>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-3">
            <ul className="text-sm text-cream/65 space-y-2">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>The other side will be notified that you accepted.</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>You will both be able to message each other from the Messages page.</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>You will be redirected to the new conversation right away.</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-cream/65 hover:text-cream hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="bg-emerald-500/90 text-navy font-semibold text-sm px-5 py-2 rounded-xl hover:bg-emerald-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Accepting…' : 'Accept & start chat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
