import { CloudDrizzle, CloudLightning, Sun, Wind, type LucideIcon } from 'lucide-react'
import { moodOrder, type MoodId } from '@/lib/moods'
import { cn } from '@/lib/utils'

export const moodMeta: Record<MoodId, { label: string; hint: string; icon: LucideIcon; tint: string }> = {
  happy: { label: 'Happy', hint: 'a field of flowers', icon: Sun, tint: 'bg-amber-200/30 hover:bg-amber-200/45' },
  calm: { label: 'Calm', hint: 'wind through the meadow', icon: Wind, tint: 'bg-emerald-100/25 hover:bg-emerald-100/40' },
  tired: { label: 'Tired', hint: 'a misty mountain', icon: CloudDrizzle, tint: 'bg-sky-200/25 hover:bg-sky-200/40' },
  angry: { label: 'Angry', hint: 'a storm in the forest', icon: CloudLightning, tint: 'bg-rose-300/25 hover:bg-rose-300/40' },
}

const bubbleOffsets = ['md:-translate-y-6', 'md:translate-y-4', 'md:-translate-y-2', 'md:translate-y-8']

export function MoodBubbles({ onSelect }: { onSelect: (mood: MoodId) => void }) {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
      {moodOrder.map((id, i) => {
        const { label, hint, icon: Icon, tint } = moodMeta[id]
        return (
          <li key={id} className={cn('bubble-pop', bubbleOffsets[i])} style={{ animationDelay: `${0.6 + i * 0.25}s` }}>
            <div className="bubble-float" style={{ animationDelay: `${i * -1.4}s` }}>
              {id === 'angry' && <Icon aria-hidden="true" className="mx-auto mb-[-1.75rem] size-7 drop-shadow" />}
              <button
                type="button"
                onClick={() => onSelect(id)}
                className={cn(
                  'group flex size-32 flex-col items-center justify-center gap-1.5 rounded-full border border-white/50 text-white shadow-[inset_0_2px_12px_rgba(255,255,255,0.45),0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-md transition-transform duration-300 hover:scale-110 focus-visible:scale-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:size-36',
                  tint,
                )}
              >
                {id !== 'angry' && <Icon aria-hidden="true" className="size-7 drop-shadow transition-transform duration-500 group-hover:rotate-12" />}
                <span className="font-serif text-xl leading-none drop-shadow">{label}</span>
                <span className="max-w-[7rem] text-center text-[11px] leading-tight text-white/85">{hint}</span>
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function MoodDock({ active, onSelect }: { active: MoodId; onSelect: (mood: MoodId) => void }) {
  return (
    <nav aria-label="Switch mood">
      <ul className="flex flex-wrap gap-2">
        {moodOrder.map((id) => {
          const { label, icon: Icon } = moodMeta[id]
          const isActive = id === active
          return (
            <li key={id}>
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => onSelect(id)}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-4 py-2 text-sm backdrop-blur-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                  isActive
                    ? 'border-white bg-white text-slate-800'
                    : 'border-white/40 bg-white/15 text-white hover:bg-white/30',
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
