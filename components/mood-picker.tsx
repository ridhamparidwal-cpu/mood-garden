import { CloudDrizzle, CloudLightning, Sun, Wind, type LucideIcon } from 'lucide-react'
import { moodOrder, type MoodId } from '@/lib/moods'
import { cn } from '@/lib/utils'

export const moodMeta: Record<MoodId, { label: string; hint: string; icon: LucideIcon; tint: string }> = {
  happy: { label: 'Happy', hint: 'a field of flowers', icon: Sun, tint: 'bg-amber-200/30 hover:bg-amber-200/45' },
  calm: { label: 'Calm', hint: 'wind through the meadow', icon: Wind, tint: 'bg-emerald-100/25 hover:bg-emerald-100/40' },
  tired: { label: 'Tired', hint: 'a misty mountain', icon: CloudDrizzle, tint: 'bg-sky-200/25 hover:bg-sky-200/40' },
  angry: { label: 'Angry', hint: 'a storm in the forest', icon: CloudLightning, tint: 'bg-rose-300/25 hover:bg-rose-300/40' },
}

export function MoodBubbles({ onSelect }: { onSelect: (mood: MoodId) => void }) {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
      {moodOrder.map((id) => {
        const { label, hint, icon: Icon, tint } = moodMeta[id]

        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => onSelect(id)}
              className={cn(
                'group flex size-28 flex-col items-center justify-center gap-1.5 rounded-full border border-white/50 text-white shadow-[inset_0_2px_12px_rgba(255,255,255,0.35),0_10px_24px_rgba(15,23,42,0.18)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                tint,
              )}
            >
              <Icon aria-hidden="true" className="size-6 drop-shadow transition-transform duration-500 group-hover:rotate-12" />
              <span className="font-serif text-lg leading-none drop-shadow">{label}</span>
              <span className="max-w-[7rem] text-center text-[10px] leading-tight text-white/85">{hint}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
