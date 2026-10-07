'use client'

import { useEffect, useRef, useState } from 'react'
import { SendHorizontal, Sprout, X } from 'lucide-react'
import { askFriend, offlineFriendReply, type FriendTurn } from '@/lib/ai'
import type { SceneId } from '@/lib/moods'
import { cn } from '@/lib/utils'

type Message = { id: string; from: 'user' | 'bot'; text: string }

const WELCOME: Message = {
  id: 'welcome',
  from: 'bot',
  text: 'Hey friend, how are you feeling today? I can help you grow a calmer, brighter garden.',
}

const REQUEST_TIMEOUT_MS = 30_000

type FriendChatProps = {
  open: boolean
  onClose: () => void
  scene: SceneId
  onUserMessage?: () => void
}

export function FriendChat({ open, onClose, scene, onUserMessage }: FriendChatProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [offline, setOffline] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const logRef = useRef<HTMLDivElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' })
  }, [messages, pending])

  const send = async () => {
    const text = input.trim()
    if (!text || pending) return

    const next: Message[] = [...messages, { id: crypto.randomUUID(), from: 'user', text }]
    setMessages(next)
    setInput('')
    setPending(true)
    onUserMessage?.()

    const controller = new AbortController()
    abortRef.current = controller
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    const turns: FriendTurn[] = next.map((m) => ({
      role: m.from === 'user' ? 'user' : 'assistant',
      content: m.text,
    }))

    let reply: string
    try {
      reply = (await askFriend(turns, scene, controller.signal)).reply
      if (mounted.current) setOffline(false)
    } catch {
      if (!mounted.current) return
      reply = offlineFriendReply(text)
      setOffline(true)
    } finally {
      clearTimeout(timeout)
    }

    setMessages((current) => [...current, { id: crypto.randomUUID(), from: 'bot', text: reply }])
    setPending(false)
  }

  return (
    <section
      className={cn('friend-panel', open && 'open')}
      aria-label="Chat with Fern, your garden friend"
      aria-hidden={!open}
      inert={!open}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <header className="friend-header">
        <div className="friend-avatar" aria-hidden="true">
          <Sprout className="size-4" />
        </div>
        <div className="friend-title">
          <strong>Fern</strong>
          <span>your garden friend</span>
        </div>
        <button type="button" onClick={onClose} className="friend-close" aria-label="Close chat">
          <X className="size-4" />
        </button>
      </header>

      <div ref={logRef} className="chat-window friend-log" role="log" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={cn('chat-bubble', message.from)}>
            {message.text}
          </div>
        ))}
        {pending && (
          <div className="chat-bubble bot typing" role="status" aria-label="Fern is typing">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      {offline && (
        <p className="friend-note">
          Smart replies are offline, so I&apos;m using simple ones. Start the AI backend to bring me back.
        </p>
      )}

      <form
        className="chat-input-row"
        onSubmit={(event) => {
          event.preventDefault()
          void send()
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Tell Fern how you feel..."
          className="chat-input"
          aria-label="Message Fern"
          maxLength={500}
          autoComplete="off"
        />
        <button
          type="submit"
          className="primary-button small friend-send"
          disabled={!input.trim() || pending}
          aria-label="Send message"
        >
          <SendHorizontal className="size-4" />
        </button>
      </form>
    </section>
  )
}
