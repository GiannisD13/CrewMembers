import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'

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
  content: string
  created_at: string
}

interface UserLite {
  id: string
  first_name: string
  last_name: string
  photo_url: string | null
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatDay(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  const yest = new Date(today); yest.setDate(today.getDate() - 1)
  if (d.toDateString() === yest.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Messages() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const activeId = id ? Number(id) : null

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [users, setUsers] = useState<Record<string, UserLite>>({})
  const [loadingList, setLoadingList] = useState(true)

  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const threadEndRef = useRef<HTMLDivElement>(null)

  // Load conversations once
  useEffect(() => {
    api.get<Conversation[]>('/api/v1/conversations')
      .then(async list => {
        setConversations(list)
        const otherIds = Array.from(new Set(list.map(c =>
          user?.account_type === 'owner' ? c.crew_member_id : c.owner_id
        )))
        const fetched = await Promise.all(otherIds.map(uid =>
          api.get<UserLite>(`/api/v1/users/${uid}`).catch(() => null)
        ))
        const map: Record<string, UserLite> = {}
        otherIds.forEach((uid, i) => { if (fetched[i]) map[uid] = fetched[i]! })
        setUsers(map)
      })
      .catch(() => setConversations([]))
      .finally(() => setLoadingList(false))
  }, [user?.account_type])

  // Load messages and poll
  const loadMessages = useCallback(async (convId: number, silent = false) => {
    if (!silent) setLoadingMsgs(true)
    try {
      const data = await api.get<Message[]>(`/api/v1/conversations/${convId}/messages?limit=100`)
      setMessages(data)
    } catch {
      if (!silent) setMessages([])
    } finally {
      if (!silent) setLoadingMsgs(false)
    }
  }, [])

  useEffect(() => {
    if (!activeId) {
      setMessages([])
      return
    }
    loadMessages(activeId)
    const i = setInterval(() => loadMessages(activeId, true), 5000)
    return () => clearInterval(i)
  }, [activeId, loadMessages])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim() || !activeId) return
    setSending(true)
    try {
      const msg = await api.post<Message>('/api/v1/messages', {
        conversation_id: activeId,
        content: draft.trim(),
      })
      setMessages(prev => [...prev, msg])
      setDraft('')
    } catch (err) {
      alert((err as ApiError).detail ?? 'Failed to send.')
    } finally {
      setSending(false)
    }
  }

  const otherUserOf = (c: Conversation) =>
    users[user?.account_type === 'owner' ? c.crew_member_id : c.owner_id]

  const activeConversation = conversations.find(c => c.id === activeId) ?? null
  const activeOther = activeConversation ? otherUserOf(activeConversation) : null

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex">

      {/* Conversations list — full width on mobile when no thread, hidden when thread is open */}
      <aside className={`${activeId ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 lg:flex-shrink-0 border-r border-white/8 bg-navy-mid`}>
        <div className="px-5 py-4 border-b border-white/8">
          <h1 className="font-display text-lg font-semibold text-cream">Messages</h1>
          <p className="text-xs text-cream/40 mt-0.5">Conversations from accepted applications.</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="text-3xl opacity-30 mb-3">💬</div>
              <p className="text-sm text-cream/45">No conversations yet.</p>
              <p className="text-xs text-cream/30 mt-1">
                A conversation starts when an application is accepted.
              </p>
            </div>
          ) : (
            <ul>
              {conversations.map(c => {
                const other = otherUserOf(c)
                const initials = other ? `${other.first_name[0]}${other.last_name[0]}`.toUpperCase() : '?'
                const isActive = c.id === activeId
                return (
                  <li key={c.id}>
                    <Link
                      to={`/messages/${c.id}`}
                      className={`flex items-center gap-3 px-5 py-3 border-b border-white/5 transition-colors ${
                        isActive ? 'bg-gold/8' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                        {other?.photo_url ? (
                          <img src={other.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-display text-sm font-semibold text-gold">{initials}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-gold' : 'text-cream'}`}>
                          {other ? `${other.first_name} ${other.last_name}` : 'Unknown user'}
                        </p>
                        <p className="text-[11px] text-cream/35">Started {formatDay(c.created_at)}</p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Thread */}
      <section className={`${activeId ? 'flex' : 'hidden lg:flex'} flex-1 min-w-0 flex-col bg-navy`}>
        {!activeConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-6">
              <div className="text-3xl opacity-30 mb-3">💬</div>
              <p className="text-sm text-cream/45">Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-white/8 bg-navy-mid">
              <button
                onClick={() => navigate('/messages')}
                className="lg:hidden p-1.5 -ml-1.5 text-cream/50 hover:text-cream transition-colors"
                aria-label="Back"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-9 h-9 rounded-full overflow-hidden bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                {activeOther?.photo_url ? (
                  <img src={activeOther.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-xs font-semibold text-gold">
                    {activeOther ? `${activeOther.first_name[0]}${activeOther.last_name[0]}`.toUpperCase() : '?'}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-cream truncate">
                  {activeOther ? `${activeOther.first_name} ${activeOther.last_name}` : 'Conversation'}
                </p>
                <p className="text-[11px] text-cream/35">Started {formatDay(activeConversation.created_at)}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-2">
              {loadingMsgs ? (
                <div className="flex justify-center py-10">
                  <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-xs text-cream/35 py-10">
                  No messages yet — say hello.
                </p>
              ) : (
                messages.map((m, i) => {
                  const isMine = m.sender_id === user?.id
                  const prev = messages[i - 1]
                  const showDay = !prev || formatDay(prev.created_at) !== formatDay(m.created_at)
                  return (
                    <div key={m.id}>
                      {showDay && (
                        <p className="text-center text-[10px] uppercase tracking-wider text-cream/30 my-3">
                          {formatDay(m.created_at)}
                        </p>
                      )}
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] sm:max-w-[60%] px-4 py-2.5 rounded-2xl ${
                          isMine
                            ? 'bg-gold/90 text-navy rounded-br-sm'
                            : 'bg-white/8 text-cream rounded-bl-sm'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-navy/60' : 'text-cream/40'}`}>
                            {formatTime(m.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={threadEndRef} />
            </div>

            {/* Compose */}
            <form onSubmit={sendMessage} className="px-4 sm:px-6 py-3 border-t border-white/8 bg-navy-mid">
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage(e as unknown as React.FormEvent)
                    }
                  }}
                  rows={1}
                  placeholder="Type a message…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-cream placeholder-cream/25 focus:outline-none focus:border-gold/60 transition-colors resize-none max-h-32"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="bg-gold text-navy font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {sending ? '…' : 'Send'}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  )
}
