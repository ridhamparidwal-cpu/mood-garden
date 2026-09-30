import type { CSSProperties } from 'react'

type ParticleKind = 'petal' | 'seed' | 'leaf'

type Props = {
  kind: ParticleKind
  count: number
  colors: string[]
  minDuration: number
  maxDuration: number
  startPosition?: 'left' | 'top-left'
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

export function DriftingParticles({ kind, count, colors, minDuration, maxDuration, startPosition = 'left' }: Props) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const duration = minDuration + seeded(i, 1) * (maxDuration - minDuration)
        
        let top: string
        let left: string
        let driftX: number
        let driftY: number

        if (startPosition === 'top-left') {
          // Start from top-left area, fall downward and slightly right
          top = `${Math.round(seeded(i, 2) * 80) - 15}%` // -40% to 40% (top area)
          left = `${Math.round(seeded(i, 7) * 100) - 15}%` // -50% to 50% (left area)
          driftX = 100 // Move right (was 115vw)
          driftY = Math.round((seeded(i, 4) - 0.35) * 80) // Up/down movement
        } else {
          // Original behavior: start from left
          top = `${Math.round(seeded(i, 2) * 90)}%`
          left = -5
          driftX = 115
          driftY = Math.round((seeded(i, 4) - 0.35) * 40)
        }

        const style = {
          top,
          ...(startPosition === 'top-left' ? { left } : {}),
          animationDuration: `${duration.toFixed(2)}s`,
          animationDelay: `${(-seeded(i, 3) * duration).toFixed(2)}s`,
          '--drift-y': `${driftY}vh`,
          '--drift-x': `${driftX}vw`,
          '--drift-scale': (0.6 + seeded(i, 5) * 0.8).toFixed(2),
        } as CSSProperties
        
        const className = startPosition === 'top-left' 
          ? 'drift-particle-topleft absolute' 
          : 'drift-particle absolute -left-[5%]'

        return (
          <span key={i} className={className} style={style}>
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
