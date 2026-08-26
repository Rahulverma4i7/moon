'use client'

import { useEffect, useState } from 'react'
import { MoonDisplay } from '@/components/moon-display'
import { getPhaseFactor } from '@/lib/moonCalc'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

interface Decision {
  glyph: string
  label: string
  desc: string
}

function getDecision(phase: number): Decision {
  // Four quadrants of the synodic cycle.
  if (phase < 0.25) {
    return {
      glyph: '\uD83C\uDF11',
      label: 'NEW DECISIONS',
      desc: 'A New Moon window. Start fresh and set your intention.',
    }
  }
  if (phase < 0.5) {
    return {
      glyph: '\uD83C\uDF12',
      label: 'TAKE ACTION',
      desc: 'Waxing energy. Push forward and build momentum.',
    }
  }
  if (phase < 0.75) {
    return {
      glyph: '\uD83C\uDF15',
      label: 'GRATITUDE',
      desc: 'Full Moon light. Celebrate and give thanks for progress.',
    }
  }
  return {
    glyph: '\uD83C\uDF18',
    label: 'RELEASE UNWANTED',
    desc: 'Waning phase. Let go of what no longer serves you.',
  }
}

export default function MoonCyclePage() {
  const [date, setDate] = useState(todayISO())
  // Start null so server and client render identically; compute after mount.
  const [phase, setPhase] = useState<number | null>(null)
  const [source, setSource] = useState<'api' | 'fallback'>('fallback')

  useEffect(() => {
    let cancelled = false
    const target = new Date(date)

    async function load() {
      // Hybrid fetch: try the mock API, fall back to pure JS math on any error.
      try {
        const res = await fetch(`/api/moon?date=${date}`)
        if (!res.ok) throw new Error('bad response')
        const data = await res.json()
        if (typeof data.phase !== 'number') throw new Error('bad payload')
        if (!cancelled) {
          setPhase(data.phase)
          setSource('api')
        }
      } catch {
        if (!cancelled) {
          setPhase(getPhaseFactor(target))
          setSource('fallback')
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [date])

  const loading = phase === null
  const decision = getDecision(phase ?? 0)

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center py-8">
      <h1 className="text-balance text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        Moon Cycle Tracker
      </h1>
      <p className="mt-3 text-center leading-relaxed text-muted-foreground">
        Pick a date to see the lunar phase and the decision it invites.
      </p>

      <div className="mt-8 flex flex-col items-center gap-2">
        <label htmlFor="date" className="text-sm font-medium text-muted-foreground">
          Select a date
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-foreground backdrop-blur-md outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="mt-10">
        <MoonDisplay phase={phase ?? 0.5} />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Phase Factor:{' '}
        <span className="font-mono text-primary">
          {loading ? '—' : (phase as number).toFixed(3)}
        </span>
        <span className="ml-2 text-xs uppercase tracking-widest opacity-60">
          ({source})
        </span>
      </p>

      <div className="mt-6 w-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
        <div className="text-5xl" aria-hidden="true">
          {loading ? '\u2728' : decision.glyph}
        </div>
        <h2
          className="mt-4 text-3xl font-bold tracking-tight text-primary md:text-4xl"
          style={{ textShadow: '0 0 30px rgba(251, 191, 36, 0.45)' }}
        >
          {loading ? 'READING THE SKY' : decision.label}
        </h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {loading ? 'Calculating the lunar phase...' : decision.desc}
        </p>
      </div>
    </div>
  )
}
