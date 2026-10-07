// Thin client for the Python AI backend in /ai-backend.
// All the "thinking" (mood detection, friend replies, safety checks) lives there;
// this file only sends requests and returns the answers.

import type { MoodId, SceneId } from '@/lib/moods'

const AI_BASE = (process.env.NEXT_PUBLIC_AI_URL ?? 'http://localhost:8000').replace(/\/$/, '')

export type AiSource = 'claude' | 'local' | 'safety' | 'none'

export type MoodDetection = {
  mood: MoodId | null
  confidence: number
  source: AiSource
  support: boolean
  note: string | null
}

export type FriendTurn = { role: 'user' | 'assistant'; content: string }

// Journal auto-detect tuning: wait for this much text, and only change the
// wallpaper when the backend is at least this confident.
export const AUTO_MOOD_MIN_CHARS = 12
export const AUTO_MOOD_MIN_CONFIDENCE = 0.6
export const AUTO_MOOD_DEBOUNCE_MS = 900

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${AI_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!response.ok) throw new Error(`AI backend returned ${response.status}`)
  return (await response.json()) as T
}

export function detectMood(text: string, signal?: AbortSignal) {
  return post<MoodDetection>('/detect-mood', { text }, signal)
}

export function askFriend(messages: FriendTurn[], scene: SceneId, signal?: AbortSignal) {
  return post<{ reply: string; source: AiSource }>('/chat', { messages: messages.slice(-20), scene }, signal)
}

// Used only when the Python backend can't be reached, so the chat never goes silent.
export function offlineFriendReply(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('angry') || lower.includes('frustrated') || lower.includes('upset')) {
    return 'I hear you. A quick walk or a few slow breaths can help your garden settle. Want to journal what set it off?'
  }
  if (lower.includes('tired') || lower.includes('exhausted')) {
    return 'Rest is part of growth. Try a smaller step today and let your garden breathe for a moment.'
  }
  if (lower.includes('calm') || lower.includes('happy') || lower.includes('good')) {
    return 'That is lovely. Keep nurturing the good energy in your garden. It grows when you pay attention to it.'
  }
  if (lower.includes('plant') || lower.includes('garden')) {
    return 'Your garden is responding to your energy. Calm moments and tiny wins help everything bloom faster.'
  }
  return 'That sounds important. Tell me more about what feels heavy right now.'
}
