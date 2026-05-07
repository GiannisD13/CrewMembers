import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../lib/api'
import { useAuth } from './AuthContext'

interface Conversation {
  id: number
  owner_id: string
  crew_member_id: string
  created_at: string
}

interface Message {
  id: number
  conversation_id: number
  sender_id: string
  created_at: string
}

type AppStatus = 'pending' | 'accepted' | 'rejected'

interface AppItem {
  id: number
  status: AppStatus
  created_at: string
}

interface NotificationsContextValue {
  newMessages: number
  hasNewApplications: boolean
  perConversationUnread: Record<number, number>
  markConversationRead: (conversationId: number, lastMessageId: number) => void
  markApplicationsSeen: () => void
  refresh: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

const POLL_INTERVAL_MS = 20_000

function lastSeenKey(userId: string, convId: number) {
  return `nf:lastSeenMsg:${userId}:${convId}`
}
function appsSnapshotKey(userId: string) {
  return `nf:appsSnapshot:${userId}`
}
function appsSeenAtKey(userId: string) {
  return `nf:appsSeenAt:${userId}`
}

function readNumber(key: string): number {
  const v = localStorage.getItem(key)
  return v ? Number(v) : 0
}

function readSnapshot(key: string): Record<string, AppStatus> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}')
  } catch {
    return {}
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [perConversationUnread, setPerConversationUnread] = useState<Record<number, number>>({})
  const [hasNewApplications, setHasNewApplications] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const computeMessagesUnread = useCallback(async (userId: string) => {
    try {
      const conversations = await api.get<Conversation[]>('/api/v1/conversations')
      const counts: Record<number, number> = {}
      await Promise.all(conversations.map(async c => {
        try {
          const msgs = await api.get<Message[]>(`/api/v1/conversations/${c.id}/messages?limit=100`)
          const lastSeen = readNumber(lastSeenKey(userId, c.id))
          const unread = msgs.filter(m => m.sender_id !== userId && m.id > lastSeen).length
          if (unread > 0) counts[c.id] = unread
        } catch { /* ignore */ }
      }))
      setPerConversationUnread(counts)
    } catch { /* ignore */ }
  }, [])

  const computeApplicationsState = useCallback(async (userId: string, accountType: 'owner' | 'crew') => {
    const snapshot = readSnapshot(appsSnapshotKey(userId))
    const seenAt = localStorage.getItem(appsSeenAtKey(userId))
    const seenAtMs = seenAt ? new Date(seenAt).getTime() : 0

    const sentPath = accountType === 'owner' ? '/api/v1/crew-inquiries/mine' : '/api/v1/job-applications/mine'
    const receivedPath = accountType === 'owner' ? '/api/v1/job-applications/received' : '/api/v1/crew-inquiries/received'
    const sentKind = accountType === 'owner' ? 'inquiry' : 'job'
    const receivedKind = accountType === 'owner' ? 'job' : 'inquiry'

    try {
      const [sent, received] = await Promise.all([
        api.get<AppItem[]>(sentPath).catch(() => [] as AppItem[]),
        api.get<AppItem[]>(receivedPath).catch(() => [] as AppItem[]),
      ])

      // New received: items created after last seen timestamp
      const newReceived = received.some(it => new Date(it.created_at).getTime() > seenAtMs)

      // Status change on sent: snapshot says pending (or unknown) but server says accepted/rejected
      const statusChanged = sent.some(it => {
        if (it.status === 'pending') return false
        const prev = snapshot[`${sentKind}:${it.id}`]
        // If we have no snapshot (first time) we won't flag — only flag genuine changes
        if (!prev) return false
        return prev !== it.status
      })

      setHasNewApplications(newReceived || statusChanged)
    } catch {
      setHasNewApplications(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!user) return
    await Promise.all([
      computeMessagesUnread(user.id),
      computeApplicationsState(user.id, user.account_type),
    ])
  }, [user, computeMessagesUnread, computeApplicationsState])

  // Polling lifecycle
  useEffect(() => {
    if (!user) {
      setPerConversationUnread({})
      setHasNewApplications(false)
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
      return
    }
    refresh()
    intervalRef.current = setInterval(refresh, POLL_INTERVAL_MS)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      window.removeEventListener('focus', onFocus)
    }
  }, [user, refresh])

  const markConversationRead = useCallback((conversationId: number, lastMessageId: number) => {
    if (!user) return
    const prev = readNumber(lastSeenKey(user.id, conversationId))
    if (lastMessageId > prev) {
      localStorage.setItem(lastSeenKey(user.id, conversationId), String(lastMessageId))
    }
    setPerConversationUnread(c => {
      if (!(conversationId in c)) return c
      const next = { ...c }
      delete next[conversationId]
      return next
    })
  }, [user])

  const markApplicationsSeen = useCallback(async () => {
    if (!user) return
    // Snapshot current sent items so future status changes can be detected
    const sentPath = user.account_type === 'owner' ? '/api/v1/crew-inquiries/mine' : '/api/v1/job-applications/mine'
    const sentKind = user.account_type === 'owner' ? 'inquiry' : 'job'
    try {
      const sent = await api.get<AppItem[]>(sentPath)
      const snap: Record<string, AppStatus> = {}
      sent.forEach(it => { snap[`${sentKind}:${it.id}`] = it.status })
      localStorage.setItem(appsSnapshotKey(user.id), JSON.stringify(snap))
    } catch { /* ignore */ }
    localStorage.setItem(appsSeenAtKey(user.id), new Date().toISOString())
    setHasNewApplications(false)
  }, [user])

  const newMessages = Object.values(perConversationUnread).reduce((a, b) => a + b, 0)

  return (
    <NotificationsContext.Provider value={{
      newMessages,
      hasNewApplications,
      perConversationUnread,
      markConversationRead,
      markApplicationsSeen,
      refresh,
    }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider')
  return ctx
}
