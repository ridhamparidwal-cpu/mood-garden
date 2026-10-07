'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  ArrowLeft,
  BookOpenText,
  Flower2,
  House,
  MessageCircleMore,
  PencilLine,
  Sparkles,
  Store,
  SunMedium,
  Trophy,
} from 'lucide-react'
import { moodOrder, scenes, type MoodId, type SceneId } from '@/lib/moods'
import { cn } from '@/lib/utils'
import { SceneWeather } from '@/components/scene-weather'
import { MoodBubbles } from '@/components/mood-picker'
import { AmbienceToggle } from '@/components/ambience-toggle'
import { FriendChat } from '@/components/friend-chat'
import {
  AUTO_MOOD_DEBOUNCE_MS,
  AUTO_MOOD_MIN_CHARS,
  AUTO_MOOD_MIN_CONFIDENCE,
  detectMood,
  type MoodDetection,
} from '@/lib/ai'

type TabId = 'home' | 'journal' | 'garden'

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
  { id: 'oak', name: 'Oak Tree', emoji: '����', cost: 100, level: 0, unlocked: false, position: 'right-16 bottom-14' },
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
  const [chatOpen, setChatOpen] = useState(false)
  const [autoMood, setAutoMood] = useState(true)
  const [detection, setDetection] = useState<MoodDetection | null>(null)
  const [detectStatus, setDetectStatus] = useState<'idle' | 'checking' | 'offline'>('idle')
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

  // Journal: while you write, ask the AI backend which mood the text sounds like
  // and, when it is confident, switch the wallpaper to match.
  useEffect(() => {
    if (activeTab !== 'journal' || !autoMood) return

    const text = journalDraft.trim()
    if (text.length < AUTO_MOOD_MIN_CHARS) {
      setDetection(null)
      setDetectStatus('idle')
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setDetectStatus('checking')
      try {
        const result = await detectMood(text, controller.signal)
        setDetection(result)
        setDetectStatus('idle')
        if (result.mood && result.confidence >= AUTO_MOOD_MIN_CONFIDENCE) {
          setSceneId(result.mood)
        }
      } catch {
        if (!controller.signal.aborted) setDetectStatus('offline')
      }
    }, AUTO_MOOD_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [journalDraft, autoMood, activeTab])

  const scene = scenes[sceneId]

  const handleMoodSelect = (mood: MoodId) => {
    setSceneId(mood)
    setActiveTab('home')
    setPoints((current) => current + moodMeta[mood].points)
  }

  const handleScreenTap = () => {
    const cycle = ['home', ...moodOrder] as SceneId[]
    const currentIndex = cycle.indexOf(sceneId)
    const nextScene = cycle[(currentIndex + 1) % cycle.length]
    setSceneId(nextScene)
    if (nextScene !== 'home') {
      setPoints((current) => current + moodMeta[nextScene].points)
    }
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
    setAutoMood(true)
    setDetection(null)
    setDetectStatus('idle')
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

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await gardenRef.current?.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
    setIsFullscreen((current) => !current)
  }

  const moodSummary = sceneId === 'home' ? moodMeta.calm : moodMeta[sceneId]
  const detectedMood =
    detection?.mood && detection.confidence >= AUTO_MOOD_MIN_CONFIDENCE ? detection.mood : null

  return (
    <main ref={gardenRef} className="garden-shell">
      <div className="garden-backdrop" aria-hidden="true">
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

      <div
        className="screen-tap-area"
        onClick={handleScreenTap}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleScreenTap()
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Cycle through moods"
      />

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
          <section className="home-overlay">
            <div className="home-badge">
              <SunMedium className="size-4" />
              <span>{sceneId === 'home' ? 'A rainy afternoon' : moodSummary.label}</span>
            </div>
            <h1 className="home-title">{sceneId === 'home' ? 'How does your heart feel today?' : moodSummary.subtitle}</h1>
            {sceneId === 'home' && (
              <>
                <p className="home-subtitle">
                  Pick how you feel, or write in your journal and the garden will sense it.
                </p>
                <div className="mood-bubble-wrap">
                  <MoodBubbles onSelect={handleMoodSelect} />
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === 'journal' && (
          <section className="content-panel journal-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Journal</p>
                <h2>Reflect on your day</h2>
              </div>
              <button type="button" onClick={() => setActiveTab('home')} className="ghost-button">
                <ArrowLeft className="size-4" /> Back
              </button>
            </div>

            <div className="glass-panel write-card journal-only-card">
              <div className="quick-moods">
                {(['happy', 'calm', 'tired', 'angry'] as MoodId[]).map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => {
                      setSceneId(mood)
                      setAutoMood(false)
                    }}
                    className={cn('mood-tag', sceneId === mood && 'active')}
                  >
                    {moodMeta[mood].emoji} {moodMeta[mood].label}
                  </button>
                ))}
              </div>

              <div className="mood-sense" aria-live="polite">
                {!autoMood ? (
                  <span>Auto-detect is off.</span>
                ) : detectStatus === 'offline' ? (
                  <span>The AI backend isn&apos;t running, so pick a mood above.</span>
                ) : detectStatus === 'checking' ? (
                  <span className="mood-sense-chip">
                    <Sparkles className="size-3.5" /> Sensing your mood...
                  </span>
                ) : detectedMood ? (
                  <span className="mood-sense-chip">
                    <Sparkles className="size-3.5" /> Feels like {moodMeta[detectedMood].emoji}{' '}
                    {moodMeta[detectedMood].label}
                  </span>
                ) : (
                  <span>Write a little and I&apos;ll sense your mood.</span>
                )}
                <button
                  type="button"
                  className="mood-sense-toggle"
                  onClick={() => setAutoMood((current) => !current)}
                >
                  {autoMood ? 'Turn off' : 'Turn on'}
                </button>
                {detection?.note && (
                  <p className="mood-sense-note" role="note">
                    {detection.note}
                  </p>
                )}
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
          </section>
        )}

        {activeTab === 'garden' && (
          <section className="content-panel garden-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">My Garden</p>
                <h2>Your little ecosystem</h2>
              </div>
              <div className="stat-pill big-pill">
                <Trophy className="size-4" />
                <span>{points} points</span>
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

            <div className="glass-panel garden-shop-panel">
              <div className="shop-header">
                <span>Garden shop</span>
                <Store className="size-4" />
              </div>
              <div className="shop-grid">
                {shopItems.map((item) => {
                  const unlocked = gardenPlants.find((plant) => plant.id === item.id)?.unlocked ?? false

                  return (
                    <div key={item.id} className="shop-card">
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
          <button type="button" onClick={() => setSceneId('home')} className="ghost-button compact">
            <ArrowLeft className="size-4" /> Back to home
          </button>
        </div>
      )}

      <FriendChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        scene={sceneId}
        onUserMessage={() => setPoints((current) => current + 2)}
      />

      <button
        type="button"
        className="friend-bubble"
        onClick={() => setChatOpen((current) => !current)}
        aria-label={chatOpen ? 'Close chat with Fern' : 'Chat with Fern, your garden friend'}
        aria-expanded={chatOpen}
      >
        <MessageCircleMore className="size-5" />
      </button>
    </main>
  )
}
