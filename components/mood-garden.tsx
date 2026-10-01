'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  ArrowLeft,
  BookOpenText,
  Bot,
  Flower2,
  Heart,
  House,
  MessageCircleMore,
  PencilLine,
  Store,
  SunMedium,
  Trophy,
  Trees,
} from 'lucide-react'
import { scenes, type MoodId, type SceneId } from '@/lib/moods'
import { cn } from '@/lib/utils'
import { SceneWeather } from '@/components/scene-weather'
import { MoodBubbles, MoodDock } from '@/components/mood-picker'
import { AmbienceToggle } from '@/components/ambience-toggle'

type TabId = 'home' | 'journal' | 'garden' | 'shop' | 'friend'

type JournalEntry = {
  id: string
  text: string
  mood: MoodId
  createdAt: string
}

type PlantItem = {
  id: string
  name: string
  emoji: string
  cost: number
  level: number
  unlocked: boolean
  position: string
}

type ChatMessage = {
  id: string
  text: string
  from: 'user' | 'bot'
}

const sceneIds = Object.keys(scenes) as SceneId[]
const moodMeta: Record<
  MoodId,
  { label: string; accent: string; emoji: string; subtitle: string; points: number }
> = {
  happy: {
    label: 'Happy',
    accent: 'from-amber-200/60 via-yellow-100/30 to-orange-100/40',
    emoji: '☀️',
    subtitle: 'Your garden is glowing',
    points: 18,
  },
  calm: {
    label: 'Calm',
    accent: 'from-emerald-200/60 via-teal-100/30 to-cyan-100/40',
    emoji: '🌿',
    subtitle: 'Your roots are settling in',
    points: 20,
  },
  tired: {
    label: 'Tired',
    accent: 'from-sky-200/60 via-blue-100/30 to-indigo-100/40',
    emoji: '🌧️',
    subtitle: 'Rest helps your heart recover',
    points: 8,
  },
  angry: {
    label: 'Angry',
    accent: 'from-rose-200/60 via-pink-100/30 to-red-100/40',
    emoji: '⚡',
    subtitle: 'Let the storm pass before you bloom again',
    points: -12,
  },
}

const initialPlants: PlantItem[] = [
  { id: 'tulip', name: 'Tulip', emoji: '🌷', cost: 20, level: 1, unlocked: true, position: 'left-8 top-16' },
  { id: 'sunflower', name: 'Sunflower', emoji: '🌻', cost: 40, level: 0, unlocked: false, position: 'right-10 top-10' },
  { id: 'rose', name: 'Rose', emoji: '🌹', cost: 60, level: 0, unlocked: false, position: 'left-16 bottom-20' },
  { id: 'oak', name: 'Oak Tree', emoji: '🌳', cost: 100, level: 0, unlocked: false, position: 'right-16 bottom-14' },
  { id: 'hut', name: 'Garden Hut', emoji: '🏡', cost: 200, level: 0, unlocked: false, position: 'center bottom-12' },
]

const shopItems = [
  { id: 'tulip', name: 'Tulip', emoji: '🌷', cost: 20 },
  { id: 'sunflower', name: 'Sunflower', emoji: '🌻', cost: 40 },
  { id: 'rose', name: 'Rose', emoji: '🌹', cost: 60 },
  { id: 'oak', name: 'Oak Tree', emoji: '🌳', cost: 100 },
  { id: 'hut', name: 'Garden Hut', emoji: '🏡', cost: 200 },
]

const navItems: { id: TabId; label: string; icon: typeof House }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'journal', label: 'Journal', icon: BookOpenText },
  { id: 'garden', label: 'Garden', icon: Flower2 },
  { id: 'shop', label: 'Shop', icon: Store },
  { id: 'friend', label: 'Friend', icon: MessageCircleMore },
]

function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

export function MoodGarden() {
  const gardenRef = useRef<HTMLElement | null>(null)
  const [sceneId, setSceneId] = useState<SceneId>('home')
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [points, setPoints] = useState<number>(120)
  const [journalDraft, setJournalDraft] = useState('')
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [gardenPlants, setGardenPlants] = useState<PlantItem[]>(initialPlants)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'welcome', from: 'bot', text: 'Hey friend, how are you feeling today? I can help you grow a calmer, brighter garden.' },
  ])
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    setPoints(getStorage('mood-garden-points', 120))
    setEntries(getStorage('mood-garden-journal', [] as JournalEntry[]))
    setGardenPlants(getStorage('mood-garden-plants', initialPlants))
  }, [])

  useEffect(() => {
    window.localStorage.setItem('mood-garden-points', JSON.stringify(points))
  }, [points])

  useEffect(() => {
    window.localStorage.setItem('mood-garden-journal', JSON.stringify(entries))
  }, [entries])

  useEffect(() => {
    window.localStorage.setItem('mood-garden-plants', JSON.stringify(gardenPlants))
  }, [gardenPlants])

  const scene = scenes[sceneId]

  const handleMoodSelect = (mood: MoodId) => {
    setSceneId(mood)
    setActiveTab('home')
    setPoints((current) => current + moodMeta[mood].points)
  }

  const handleJournalSave = () => {
    const text = journalDraft.trim()
    if (!text) return

    const nextEntry: JournalEntry = {
      id: crypto.randomUUID(),
      text,
      mood: sceneId === 'home' ? 'calm' : sceneId,
      createdAt: new Date().toISOString(),
    }

    setEntries((current) => [nextEntry, ...current])
    setJournalDraft('')
    setPoints((current) => current + 8)
  }

  const handleBuyPlant = (plantId: string) => {
    const plant = gardenPlants.find((item) => item.id === plantId)
    if (!plant) return

    if (!plant.unlocked && points >= plant.cost) {
      setPoints((current) => current - plant.cost)
      setGardenPlants((current) =>
        current.map((item) =>
          item.id === plantId ? { ...item, unlocked: true, level: 1 } : item,
        ),
      )
      return
    }

    if (plant.unlocked) {
      setGardenPlants((current) =>
        current.map((item) =>
          item.id === plantId ? { ...item, level: Math.min(item.level + 1, 5) } : item,
        ),
      )
      setPoints((current) => current + 5)
    }
  }

  const handleChatSend = () => {
    const trimmed = chatInput.trim()
    if (!trimmed) return

    const userMessage: ChatMessage = { id: crypto.randomUUID(), from: 'user', text: trimmed }
    let response = 'That sounds important. Tell me more about what feels heavy right now.'

    const lower = trimmed.toLowerCase()
    if (lower.includes('angry') || lower.includes('frustrated') || lower.includes('upset')) {
      response = 'I hear you. A quick walk or a few slow breaths can help your garden settle. Want to journal what set it off?'
    } else if (lower.includes('tired') || lower.includes('exhausted')) {
      response = 'Rest is part of growth. Try a smaller step today and let your garden breathe for a moment.'
    } else if (lower.includes('calm') || lower.includes('happy') || lower.includes('good')) {
      response = 'That is lovely. Keep nurturing the good energy in your garden—it grows when you pay attention to it.'
    } else if (lower.includes('plant') || lower.includes('garden')) {
      response = 'Your garden is responding to your energy. Calm moments and tiny wins help everything bloom faster.'
    }

    setChatMessages((current) => [...current, userMessage, { id: crypto.randomUUID(), from: 'bot', text: response }])
    setChatInput('')
    setPoints((current) => current + 2)
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await gardenRef.current?.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
    setIsFullscreen((current) => !current)
  }

  const moodSummary = moodMeta[sceneId === 'home' ? 'calm' : sceneId]

  return (
    <main ref={gardenRef} className="garden-shell">
      <div className="garden-backdrop">
        {sceneIds.map((id) => (
          <div
            key={id}
            className={cn(
              'absolute inset-0 transition-opacity duration-[1600ms] ease-in-out',
              id === sceneId ? 'opacity-100' : 'opacity-0',
            )}
          >
            <Image
              src={scenes[id].image}
              alt={id === sceneId ? scenes[id].alt : ''}
              fill
              priority={id === 'home'}
              sizes="100vw"
              className={cn('object-cover', id !== 'happy' && id !== 'calm' && 'ken-burns')}
              style={{ filter: scenes[id].imageFilter }}
            />
          </div>
        ))}
      </div>

      <div key={sceneId} className="scene-fade absolute inset-0">
        <SceneWeather sceneId={sceneId} />
      </div>

      <div className="garden-vignette" />

      <header className="app-topbar">
        <button type="button" onClick={() => setSceneId('home')} className="topbar-brand">
          Mood Garden
        </button>

        <div className="topbar-actions">
          <div className="stat-pill">
            <Trophy className="size-4" />
            <span>{points} pts</span>
          </div>
          <AmbienceToggle sceneId={sceneId} />
          <button type="button" onClick={toggleFullscreen} className="topbar-action">
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </button>
        </div>
      </header>

      <div className="app-body">
        {activeTab === 'home' && (
          <section className="home-layout">
            <div className="glass-panel hero-card">
              <div className={`hero-badge ${sceneId === 'home' ? 'from-emerald-200/60' : ''}`}>
                <span className="text-lg">{moodSummary.emoji}</span>
                <span>{sceneId === 'home' ? 'A rainy afternoon' : moodSummary.label}</span>
              </div>

              <h1 className="hero-title">How does your heart feel today?</h1>
              <p className="hero-subtitle">{sceneId === 'home' ? 'Pick a feeling and let your garden respond.' : moodSummary.subtitle}</p>

              <div className="mood-bubble-wrap">
                <MoodBubbles onSelect={handleMoodSelect} />
              </div>
            </div>

            <div className="glass-panel summary-card">
              <div className="summary-header">
                <span className="label-strong">Mood check-in</span>
                <span className="tag">{sceneId === 'home' ? 'Ready' : moodSummary.label}</span>
              </div>

              <div className="metric-row">
                <div className="metric-block">
                  <Heart className="size-4 text-rose-200" />
                  <span>Energy</span>
                  <strong>{sceneId === 'happy' ? 'High' : sceneId === 'calm' ? 'Balanced' : sceneId === 'tired' ? 'Low' : 'Charged'}</strong>
                </div>
                <div className="metric-block">
                  <Flower2 className="size-4 text-emerald-200" />
                  <span>Garden</span>
                  <strong>{gardenPlants.filter((plant) => plant.unlocked).length} grown</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('journal')}
                className="primary-button"
              >
                Write in journal
              </button>
            </div>
          </section>
        )}

        {activeTab === 'journal' && (
          <section className="content-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Journal</p>
                <h2>Reflect on your day</h2>
              </div>
              <button type="button" onClick={() => setActiveTab('home')} className="ghost-button">
                <ArrowLeft className="size-4" /> Back
              </button>
            </div>

            <div className="journal-grid">
              <div className="glass-panel write-card">
                <div className="quick-moods">
                  {(['happy', 'calm', 'tired', 'angry'] as MoodId[]).map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => setSceneId(mood)}
                      className={cn('mood-tag', sceneId === mood && 'active')}
                    >
                      {moodMeta[mood].emoji} {moodMeta[mood].label}
                    </button>
                  ))}
                </div>

                <label className="journal-label" htmlFor="journal-entry">
                  <PencilLine className="size-4" /> Today’s mood
                </label>
                <textarea
                  id="journal-entry"
                  value={journalDraft}
                  onChange={(event) => setJournalDraft(event.target.value)}
                  placeholder="I felt ..."
                  className="journal-box"
                />
                <button type="button" onClick={handleJournalSave} className="primary-button">
                  Save entry
                </button>
              </div>

              <div className="glass-panel entries-card">
                <h3>Recent entries</h3>
                <div className="entry-list">
                  {entries.length === 0 ? (
                    <p className="empty-state">No thoughts saved yet. Your garden is waiting.</p>
                  ) : (
                    entries.map((entry) => (
                      <div key={entry.id} className="entry-item">
                        <div className="entry-header">
                          <span>{moodMeta[entry.mood].emoji}</span>
                          <strong>{moodMeta[entry.mood].label}</strong>
                          <time>{new Date(entry.createdAt).toLocaleDateString()}</time>
                        </div>
                        <p>{entry.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'garden' && (
          <section className="content-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">My Garden</p>
                <h2>Your little ecosystem</h2>
              </div>
            </div>

            <div className="garden-scene glass-panel">
              <div className="garden-ground">
                {gardenPlants.map((plant) => (
                  <div
                    key={plant.id}
                    className={cn('plant-plot', plant.position, !plant.unlocked && 'locked')}
                  >
                    <div className="plant-emoji">{plant.emoji}</div>
                    <div className="plant-meta">
                      <strong>{plant.name}</strong>
                      <span>{plant.unlocked ? `Growth ${plant.level}/5` : `${plant.cost} pts`}</span>
                    </div>
                    <div className="plant-progress">
                      <span style={{ width: `${Math.max((plant.level / 5) * 100, plant.unlocked ? 20 : 0)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'shop' && (
          <section className="content-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Shop</p>
                <h2>Grow your rewards</h2>
              </div>
              <div className="stat-pill big-pill">
                <Trophy className="size-4" />
                <span>{points} points</span>
              </div>
            </div>

            <div className="shop-grid">
              {shopItems.map((item) => {
                const unlocked = gardenPlants.find((plant) => plant.id === item.id)?.unlocked ?? false

                return (
                  <div key={item.id} className="glass-panel shop-card">
                    <div className="shop-emoji">{item.emoji}</div>
                    <h3>{item.name}</h3>
                    <p>{item.cost} points</p>
                    <button
                      type="button"
                      onClick={() => handleBuyPlant(item.id)}
                      className={cn('primary-button small', unlocked && 'secondary')}
                    >
                      {unlocked ? 'Level up' : 'Buy'}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {activeTab === 'friend' && (
          <section className="content-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Friend</p>
                <h2>Chat with your garden buddy</h2>
              </div>
            </div>

            <div className="glass-panel chat-panel">
              <div className="chat-window">
                {chatMessages.map((message) => (
                  <div key={message.id} className={cn('chat-bubble', message.from === 'user' ? 'user' : 'bot')}>
                    {message.text}
                  </div>
                ))}
              </div>

              <div className="chat-input-row">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleChatSend()
                  }}
                  placeholder="Ask your friend for advice..."
                  className="chat-input"
                />
                <button type="button" onClick={handleChatSend} className="primary-button small">
                  <Bot className="size-4" /> Send
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn('nav-button', activeTab === id && 'active')}
          >
            <Icon className="size-5" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {sceneId !== 'home' && activeTab === 'home' && (
        <div className="floating-mood-bar">
          <div className="floating-mood-header">
            <span>{moodMeta[sceneId].emoji}</span>
            <span>{moodMeta[sceneId].label}</span>
          </div>
          <MoodDock active={sceneId} onSelect={handleMoodSelect} />
          <button type="button" onClick={() => setSceneId('home')} className="ghost-button compact">
            <ArrowLeft className="size-4" /> Home
          </button>
        </div>
      )}
    </main>
  )
}

