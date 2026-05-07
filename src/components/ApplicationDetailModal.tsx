import { useEffect } from 'react'

type AppStatus = 'pending' | 'accepted' | 'rejected'

interface SenderLite {
  id: string
  first_name: string
  last_name: string
  photo_url: string | null
}

interface ListingLite {
  id: number
  title: string
  role: string
  location: string | null
}

interface ApplicationDetailModalProps {
  isOpen: boolean
  onClose: () => void
  status: AppStatus
  message: string | null
  cvUrl: string | null
  createdAt: string
  sender: SenderLite | null
  listing: ListingLite | null
  isReceived: boolean
  acting: boolean
  onAccept?: () => void
  onReject?: () => void
  onWithdraw?: () => void
  onOpenProfile?: () => void
}

const ROLE_LABELS: Record<string, string> = {
  captain: 'Captain', first_mate: 'First Mate', chef: 'Chef / Cook',
  engineer: 'Engineer', sailor: 'Sailor', steward: 'Steward / Stewardess', deckhand: 'Deckhand',
}

const STATUS_PILL: Record<AppStatus, string> = {
  pending: 'bg-gold/15 text-gold border-gold/25',
  accepted: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/25',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ApplicationDetailModal({
  isOpen, onClose, status, message, cvUrl, createdAt,
  sender, listing, isReceived, acting,
  onAccept, onReject, onWithdraw, onOpenProfile,
}: ApplicationDetailModalProps) {

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !acting) onClose() }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, acting, onClose])

  const initials = sender ? `${sender.first_name[0]}${sender.last_name[0]}`.toUpperCase() : '?'
  const senderName = sender ? `${sender.first_name} ${sender.last_name}` : 'Unknown'

  return (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-200 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div onClick={acting ? undefined : onClose} className="absolute inset-0 bg-navy/85 backdrop-blur-md" />

      <div className="relative h-full flex items-center justify-center p-0 sm:p-4">
        <div className="w-full sm:max-w-xl h-full sm:h-auto sm:max-h-[85vh] bg-navy-mid sm:border border-white/10 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">

          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-white/8 flex items-start justify-between gap-3 flex-shrink-0">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-cream/35 mb-1">
                {isReceived ? 'Application received' : 'Application sent'}
              </p>
              <h2 className="font-display text-lg font-semibold text-cream truncate">
                {senderName}
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border ${STATUS_PILL[status]}`}>
                {status}
              </span>
              <button
                onClick={onClose}
                disabled={acting}
                className="p-1.5 text-cream/40 hover:text-cream/80 transition-colors disabled:opacity-50"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body (scrollable) */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* Sender card */}
            <button
              type="button"
              onClick={onOpenProfile}
              disabled={!onOpenProfile}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/8 hover:border-gold/30 hover:bg-gold/[0.04] transition-all group disabled:opacity-100 disabled:cursor-default text-left"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gold/10 border border-gold/25 flex items-center justify-center flex-shrink-0">
                {sender?.photo_url ? (
                  <img src={sender.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-sm font-semibold text-gold">{initials}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-cream group-hover:text-gold transition-colors truncate">{senderName}</p>
                {onOpenProfile && (
                  <p className="text-[11px] text-cream/45 mt-0.5">View profile →</p>
                )}
              </div>
            </button>

            {/* Listing context */}
            {listing && (
              <div className="rounded-xl bg-navy/40 border border-white/5 p-4">
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-cream/35 mb-2">
                  About listing
                </p>
                <div className="flex items-start gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-semibold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold inline-block">
                    {ROLE_LABELS[listing.role] ?? listing.role}
                  </span>
                </div>
                <h4 className="font-display text-sm font-semibold text-cream">{listing.title}</h4>
                {listing.location && (
                  <p className="text-xs text-cream/45 mt-0.5">{listing.location}</p>
                )}
              </div>
            )}

            {/* Message */}
            <div>
              <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-cream/35 mb-2">
                Message
              </p>
              {message ? (
                <p className="text-sm text-cream/80 whitespace-pre-wrap leading-relaxed">{message}</p>
              ) : (
                <p className="text-sm text-cream/40 italic">No message provided.</p>
              )}
            </div>

            {/* CV */}
            {cvUrl && (
              <div>
                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-cream/35 mb-2">
                  Attachment
                </p>
                <a
                  href={cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gold/10 border border-gold/25 text-gold hover:bg-gold/20 transition-colors text-xs font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View CV (PDF)
                </a>
              </div>
            )}

            {/* Submitted */}
            <div className="pt-3 border-t border-white/5">
              <p className="text-[11px] text-cream/35">Submitted on {formatDate(createdAt)}</p>
            </div>
          </div>

          {/* Footer actions */}
          {status === 'pending' && (isReceived || onWithdraw) && (
            <div className="px-6 py-4 border-t border-white/8 flex justify-end gap-2 flex-shrink-0 bg-navy-mid">
              {isReceived ? (
                <>
                  <button
                    onClick={onReject}
                    disabled={acting}
                    className="text-xs font-medium px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-cream/60 hover:text-red-400 hover:border-red-400/30 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={onAccept}
                    disabled={acting}
                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                  >
                    {acting ? 'Accepting…' : 'Accept'}
                  </button>
                </>
              ) : (
                <button
                  onClick={onWithdraw}
                  disabled={acting}
                  className="text-xs font-medium px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-cream/60 hover:text-red-400 hover:border-red-400/30 transition-colors disabled:opacity-50"
                >
                  {acting ? 'Withdrawing…' : 'Withdraw'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
