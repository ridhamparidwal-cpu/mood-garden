import type { CSSProperties } from 'react'

type ParticleKind = 'petal' | 'seed' | 'leaf'

type Props = {
  kind: ParticleKind
  count: number
  colors: string[]
  minDuration: number
  maxDuration: number
}

function seeded(index: number, salt: number) {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453
  return Math.round((x - Math.floor(x)) * 1000) / 1000
}

const shapeClass: Record<ParticleKind, string> = {
  petal: 'h-2.5 w-3.5 rounded-[100%_0_100%_0]',
  seed: 'size-1.5 rounded-full shadow-[0_0_8px_2px_rgba(255,255,255,0.6)]',
  leaf: 'h-2 w-4 rounded-[100%_0_100%_0]',
}

export function DriftingParticles({ kind, count, colors, minDuration, maxDuration }: Props) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const duration = minDuration + seeded(i, 1) * (maxDuration - minDuration)
        const style = {
          top: `${Math.round(seeded(i, 2) * 90)}%`,
          animationDuration: `${duration.toFixed(2)}s`,
          animationDelay: `${(-seeded(i, 3) * duration).toFixed(2)}s`,
          '--drift-y': `${Math.round((seeded(i, 4) - 0.35) * 40)}vh`,
          '--drift-scale': (0.6 + seeded(i, 5) * 0.8).toFixed(2),
        } as CSSProperties
        return (
          <span key={i} className="drift-particle absolute -left-[5%]" style={style}>
            <span
              className={`flutter block ${shapeClass[kind]}`}
              style={{
                backgroundColor: colors[i % colors.length],
                animationDuration: `${(1.2 + seeded(i, 6) * 2).toFixed(2)}s`,
              }}
            />
          </span>
        )
      })}
    </div>
  )
}
