'use client'

import { useEffect, useRef } from 'react'
import type { RainConfig } from '@/lib/moods'

type Drop = { x: number; y: number; len: number; v: number; near: boolean }
type Splash = { x: number; y: number; life: number }

export function RainCanvas({ config }: { config: RainConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const { density, speed, angle, length, opacity, splash } = config
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let drops: Drop[] = []
    let splashes: Splash[] = []
    let frame = 0
    let last = performance.now()

    const makeDrop = (initial: boolean): Drop => ({
      x: Math.random() * (width + height * angle) - height * angle,
      y: initial ? Math.random() * height : -Math.random() * 120,
      len: length * (0.55 + Math.random() * 0.9),
      v: speed * (0.7 + Math.random() * 0.6),
      near: Math.random() > 0.7,
    })

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(density * Math.max(0.45, width / 1440))
      drops = Array.from({ length: count }, () => makeDrop(true))
    }

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, width, height)
      ctx.lineCap = 'round'

      for (const near of [false, true]) {
        ctx.beginPath()
        ctx.strokeStyle = `rgba(225, 238, 255, ${near ? opacity : opacity * 0.6})`
        ctx.lineWidth = near ? 1.4 : 0.8
        for (const d of drops) {
          if (d.near !== near) continue
          d.x += d.v * angle * dt
          d.y += d.v * dt
          ctx.moveTo(d.x, d.y)
          ctx.lineTo(d.x - angle * d.len, d.y - d.len)
          if (d.y - d.len > height) {
            if (splash && Math.random() > 0.55) {
              splashes.push({ x: d.x, y: height - Math.random() * height * 0.25, life: 1 })
            }
            Object.assign(d, makeDrop(false))
          }
        }
        ctx.stroke()
      }

      if (splashes.length) {
        ctx.beginPath()
        ctx.strokeStyle = `rgba(225, 238, 255, ${opacity * 0.7})`
        ctx.lineWidth = 1
        for (const s of splashes) {
          const r = (1 - s.life) * 7 + 1
          ctx.moveTo(s.x + r, s.y)
          ctx.ellipse(s.x, s.y, r, r * 0.35, 0, 0, Math.PI, true)
          s.life -= 0.06 * dt
        }
        ctx.stroke()
        splashes = splashes.filter((s) => s.life > 0)
      }
    }

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 3)
      last = now
      draw(dt)
      frame = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize)
    if (reduceMotion) {
      draw(0)
    } else {
      frame = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [config])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />
}
