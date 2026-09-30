'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { scenes, type MoodId, type SceneId } from '@/lib/moods'
import { cn } from '@/lib/utils'
import { SceneWeather } from '@/components/scene-weather'
import { MoodBubbles, MoodDock } from '@/components/mood-picker'
import { AmbienceToggle } from '@/components/ambience-toggle'

const sceneIds = Object.keys(scenes) as SceneId[]

export function MoodGarden() {
  const [sceneId, setSceneId] = useState<SceneId>('home')
  const scene = scenes[sceneId]
  const selectMood = (mood: MoodId) => setSceneId(mood)

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-slate-800 text-white">
      <div className="absolute inset-0">
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

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.35))]" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-5 md:p-8">
        <button
          type="button"
          onClick={() => setSceneId('home')}
          className="font-serif text-2xl tracking-wide drop-shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          Mood Garden
        </button>
        <AmbienceToggle sceneId={sceneId} />
        {sceneId !== 'home' && (
          <button
            type="button"
            onClick={() => setSceneId('home')}
            className="flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-4 py-2 text-sm backdrop-blur-md transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to the rain
          </button>
        )}
      </header>

      {sceneId === 'home' ? (
        <section
          aria-labelledby="home-title"
          className="relative z-10 flex h-full flex-col items-center justify-center gap-10 px-6 pt-16 text-center font-[system-ui] md:gap-14"
        >
          <div className="scene-fade flex max-w-xl flex-col items-center gap-4">
            <p className="text-sm uppercase tracking-[0.3em] text-white/80 drop-shadow">A rainy afternoon</p>
            <h1 id="home-title" className="text-balance font-serif text-4xl leading-tight drop-shadow-lg md:text-6xl">
              How does your heart feel today?
            </h1>
            <p className="text-pretty font-[Raleway,sans-serif] text-base text-white/85 drop-shadow shadow-sm md:text-lg">
              Pick a feeling
            </p>
          </div>
          <MoodBubbles onSelect={selectMood} />
        </section>
      ) : (
        <section
          aria-live="polite"
          className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-5 bg-gradient-to-t from-black/45 to-transparent p-5 pt-24 md:flex-row md:items-end md:justify-between md:p-8 md:pt-32"
        >
          <div key={sceneId} className="scene-rise max-w-md">
            <h2 className="font-serif text-4xl drop-shadow-lg md:text-6xl">{scene.title}</h2>
            <p className="mt-2 text-pretty text-base text-white/90 drop-shadow md:text-lg">{scene.caption}</p>
          </div>
          <MoodDock active={sceneId} onSelect={selectMood} />
        </section>
      )}
    </main>
  )
}
