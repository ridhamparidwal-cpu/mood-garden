'use client'

import { useState } from 'react'
import { BookOpen, Sprout } from 'lucide-react'

type JournalEntry = {
  id: number
  mood: string
  text: string
  date: string
  points: number
}

type JournalProps = {
  entries: JournalEntry[]
  onAddEntry: (entry: JournalEntry) => void
}

export function Journal({ entries, onAddEntry }: JournalProps) {
  const [text, setText] = useState('')
  const [selectedMood, setSelectedMood] = useState('Happy')

  const saveEntry = () => {
    if (!text.trim()) return

    const entry: JournalEntry = {
      id: Date.now(),
      mood: selectedMood,
      text: text.trim(),
      date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      points: 10,
    }

    onAddEntry(entry)
    setText('')
  }

  return (
    <div className="min-h-full overflow-y-auto bg-gradient-to-b from-[#cfeafa] via-[#dff3e8] to-[#b9d9bd] px-5 pb-32 pt-8 text-[#365d45]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="size-8" />
            <h1 className="font-serif text-4xl font-semibold">Journal</h1>
          </div>

          <p className="mt-1 text-[#668772]">
            Your garden of thoughts
          </p>
        </div>

        <div className="mb-8 rounded-[2rem] border border-white/70 bg-[#f7f5e8]/90 p-6 shadow-lg backdrop-blur-xl">
          <h2 className="font-serif text-2xl">
            How are you feeling?
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {['Happy', 'Calm', 'Tired', 'Angry'].map((mood) => (
              <button
                key={mood}
                type="button"
                onClick={() => setSelectedMood(mood)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  selectedMood === mood
                    ? 'bg-[#5b8b69] text-white'
                    : 'bg-[#e5ecdf] text-[#52745c] hover:bg-[#d8e4d2]'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind today?"
            className="mt-5 min-h-40 w-full resize-none rounded-2xl border border-[#d7dfd2] bg-white/70 p-4 text-[#365d45] outline-none placeholder:text-[#91a694] focus:border-[#7fa38a]"
          />

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-[#78917d]">
              +10 Garden Points
            </span>

            <button
              type="button"
              onClick={saveEntry}
              disabled={!text.trim()}
              className="flex items-center gap-2 rounded-full bg-[#527b5f] px-5 py-3 font-medium text-white transition hover:bg-[#42684e] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sprout className="size-4" />
              Plant this feeling
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-[1.75rem] border border-white/70 bg-[#f7f5e8]/90 p-5 shadow-md backdrop-blur-xl"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full bg-[#e4edda] px-4 py-1.5 text-sm font-medium text-[#4f7959]">
                  🌱 {entry.mood}
                </span>

                <span className="text-sm text-[#78917d]">
                  {entry.date}
                </span>
              </div>

              <p className="mt-4 leading-7 text-[#62806b]">
                {entry.text}
              </p>

              <div className="mt-4 text-sm text-[#809884]">
                🌸 Planted &nbsp; • &nbsp; +{entry.points} points
              </div>
            </article>
          ))}

          {entries.length === 0 && (
            <div className="rounded-[1.75rem] border border-dashed border-white/80 bg-white/20 p-10 text-center text-[#6e8b76]">
              Your garden of thoughts is empty for now. 🌱
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
