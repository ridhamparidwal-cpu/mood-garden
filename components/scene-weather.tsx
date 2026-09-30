import { scenes, type SceneId } from '@/lib/moods'
import { RainCanvas } from '@/components/weather/rain-canvas'
import { DriftingParticles } from '@/components/weather/drifting-particles'
import { Mist, RainTint, Storm, SunGlow, SwayingGrass, WindSwirls } from '@/components/weather/atmosphere'

export function SceneWeather({ sceneId }: { sceneId: SceneId }) {
  const scene = scenes[sceneId]

  switch (sceneId) {
    case 'home':
      return (
        <>
          <RainTint />
          {scene.rain && <RainCanvas config={scene.rain} />}
        </>
      )
    case 'happy':
      return (
        <>
          <SwayingGrass image={scene.image} filter={scene.imageFilter} amount={0.8} />
          <SunGlow />
          <WindSwirls strength={0.5} />
          <DriftingParticles
            kind="petal"
            count={34}
            colors={['#f9c6d3', '#ffe28a', '#ffffff', '#f7a6b8', '#ffd0a1']}
            minDuration={12}
            maxDuration={22}
          />
        </>
      )
    case 'calm':
      return (
        <>
          <SwayingGrass image={scene.image} filter={scene.imageFilter} amount={1.6} />
          <WindSwirls strength={1} />
          <DriftingParticles
            kind="seed"
            count={26}
            colors={['rgba(255,255,255,0.9)']}
            minDuration={16}
            maxDuration={28}
          />
        </>
      )
    case 'tired':
      return (
        <>
          <Mist />
          {scene.rain && <RainCanvas config={scene.rain} />}
        </>
      )
    case 'angry':
      return (
        <>
          <Storm />
          <DriftingParticles
            kind="leaf"
            count={35}
            colors={['#1a2f1a', '#0f1f0f', '#1f3f1f', '#0d1f0d']}
            minDuration={3}
            maxDuration={5}
            startPosition="top-left"
          />
        </>
      )
  }
}
