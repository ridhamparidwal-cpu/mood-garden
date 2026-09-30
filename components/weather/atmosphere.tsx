const windPaths = [
  'M-100 260 C 200 200, 380 320, 560 250 S 820 140, 900 220 C 960 280, 880 330, 840 290 C 810 260, 850 220, 900 240 S 1300 300, 1700 230',
  'M-100 470 C 260 420, 480 520, 760 460 S 1120 400, 1700 470',
  'M-100 620 C 180 580, 400 660, 620 610 C 760 580, 820 520, 780 500 C 740 480, 720 540, 780 560 S 1200 600, 1700 560',
  'M-100 360 C 300 330, 600 400, 1000 350 S 1400 320, 1700 370',
]

export function WindSwirls({ strength = 1 }: { strength?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      {windPaths.map((d, i) => (
        <path
          key={i}
          d={d}
          className="wind-stroke"
          stroke="white"
          strokeWidth={i % 2 === 0 ? 2.5 : 1.6}
          strokeLinecap="round"
          style={{
            opacity: 0.55 * strength,
            animationDuration: `${7 + i * 1.7}s`,
            animationDelay: `${i * -2.3}s`,
          }}
        />
      ))}
    </svg>
  )
}

export function SwayingGrass({ image, filter, amount }: { image: string; filter: string; amount: number }) {
  return (
    <div
      aria-hidden="true"
      className="grass-sway pointer-events-none absolute inset-0 bg-cover bg-center"
      style={{
        backgroundImage: `url(${image})`,
        filter,
        ['--sway' as string]: `${amount}deg`,
      }}
    />
  )
}

export function Mist() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="mist-band absolute -left-1/2 top-[30%] h-[35%] w-[200%] opacity-60" />
      <div
        className="mist-band absolute -left-1/2 top-[55%] h-[40%] w-[200%] opacity-45"
        style={{ animationDuration: '70s', animationDirection: 'reverse' }}
      />
      <div className="absolute inset-0 bg-slate-700/25 mix-blend-multiply" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_85%,rgba(255,190,120,0.18),transparent_55%)]" />
    </div>
  )
}

export function SunGlow() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="sun-rays absolute -right-[20%] -top-[40%] size-[120vmax] opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(255,236,170,0.45),transparent_45%)]" />
    </div>
  )
}

export function Storm() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,20,30,0.55),rgba(10,20,30,0.2)_45%,rgba(5,10,15,0.5))]" />
      <div className="lightning absolute inset-0 bg-[#e8f0ff]" />
    </div>
  )
}

export function RainTint() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(40,60,80,0.35),transparent_40%,rgba(20,30,40,0.45))]"
    />
  )
}
