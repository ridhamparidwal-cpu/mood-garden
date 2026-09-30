'use client'

import { Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { SceneId } from '@/lib/moods'

type AmbienceToggleProps = {
  sceneId: SceneId
}

export function AmbienceToggle({ sceneId }: AmbienceToggleProps) {
  const [enabled, setEnabled] = useState(false)
  const audioRef = useRef<{
    context: AudioContext
    gain: GainNode
    nodes: AudioNode[]
  } | null>(null)

  useEffect(() => {
    if (!enabled) return

    const context = new AudioContext()
    const gain = context.createGain()
    const nodes: AudioNode[] = []
    gain.gain.value = sceneId === 'happy' ? 0.06 : 0.035
    gain.connect(context.destination)

    let birdTimer: ReturnType<typeof setTimeout> | undefined
    if (sceneId === 'happy') {
      const chirp = (start: number, pan: number) => {
        const bird = context.createOscillator()
        const birdGain = context.createGain()
        const panner = context.createStereoPanner()
        const base = 2600 + Math.random() * 1400
        bird.type = 'sine'
        bird.frequency.setValueAtTime(base, start)
        bird.frequency.exponentialRampToValueAtTime(base * 1.45, start + 0.05)
        bird.frequency.exponentialRampToValueAtTime(base * 0.9, start + 0.1)
        birdGain.gain.setValueAtTime(0.0001, start)
        birdGain.gain.exponentialRampToValueAtTime(0.5, start + 0.015)
        birdGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12)
        panner.pan.value = pan
        bird.connect(birdGain)
        birdGain.connect(panner)
        panner.connect(gain)
        bird.start(start)
        bird.stop(start + 0.14)
        bird.onended = () => {
          bird.disconnect()
          birdGain.disconnect()
          panner.disconnect()
        }
      }

      const singPhrase = () => {
        const pan = Math.random() * 1.6 - 0.8
        const notes = 2 + Math.floor(Math.random() * 4)
        const start = context.currentTime + 0.05
        for (let note = 0; note < notes; note += 1) {
          chirp(start + note * (0.13 + Math.random() * 0.06), pan)
        }
        birdTimer = setTimeout(singPhrase, 900 + Math.random() * 2600)
      }
      singPhrase()

      audioRef.current = { context, gain, nodes }

      return () => {
        if (birdTimer) clearTimeout(birdTimer)
        gain.disconnect()
        void context.close()
        audioRef.current = null
      }
    }

    const noise = context.createBufferSource()
    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1
    }
    noise.buffer = buffer
    noise.loop = true
    const filter = context.createBiquadFilter()
    filter.type = sceneId === 'calm' ? 'lowpass' : 'bandpass'
    filter.frequency.value = sceneId === 'tired' ? 500 : sceneId === 'angry' ? 1800 : 900
    filter.Q.value = 0.7
    noise.connect(filter)
    filter.connect(gain)
    noise.start()
    nodes.push(noise, filter)

    const breeze = context.createOscillator()
    const breezeGain = context.createGain()
    breeze.type = 'sine'
    breeze.frequency.value = sceneId === 'calm' ? 170 : 95
    breezeGain.gain.value = sceneId === 'calm' ? 0.012 : sceneId === 'angry' ? 0.002 : 0.004
    breeze.connect(breezeGain)
    breezeGain.connect(gain)
    breeze.start()
    nodes.push(breeze, breezeGain)

    let thunderTimer: ReturnType<typeof setInterval> | undefined
    if (sceneId === 'angry') {
      thunderTimer = setInterval(() => {
        const thunder = context.createOscillator()
        const thunderGain = context.createGain()
        thunder.type = 'sawtooth'
        thunder.frequency.setValueAtTime(70, context.currentTime)
        thunder.frequency.exponentialRampToValueAtTime(30, context.currentTime + 1.4)
        thunderGain.gain.setValueAtTime(0.0001, context.currentTime)
        thunderGain.gain.exponentialRampToValueAtTime(0.06, context.currentTime + 0.08)
        thunderGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.8)
        thunder.connect(thunderGain)
        thunderGain.connect(gain)
        thunder.start()
        thunder.stop(context.currentTime + 1.9)
      }, 8500)
    }

    audioRef.current = { context, gain, nodes }

    return () => {
      if (thunderTimer) clearInterval(thunderTimer)
      nodes.forEach((node) => {
        if ('stop' in node && typeof node.stop === 'function') node.stop()
        node.disconnect()
      })
      gain.disconnect()
      void context.close()
      audioRef.current = null
    }
  }, [enabled, sceneId])

  return (
    <button
      type="button"
      aria-pressed={enabled}
      aria-label={enabled ? 'Mute garden ambience' : 'Play garden ambience'}
      onClick={() => setEnabled((value) => !value)}
      className="flex items-center gap-2 rounded-full border border-white/35 bg-black/15 px-3 py-2 text-sm text-white/90 backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {enabled ? <Volume2 aria-hidden="true" className="size-4" /> : <VolumeX aria-hidden="true" className="size-4" />}
      <span className="hidden sm:inline">{enabled ? 'Sound on' : 'Sound off'}</span>
    </button>
  )
}

