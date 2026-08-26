import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const phases = [
  {
    glyph: '\uD83C\uDF11',
    title: 'New Moon',
    action: 'New Decisions',
    desc: 'Start fresh. Set intentions and plant the seeds of what you want to grow.',
  },
  {
    glyph: '\uD83C\uDF12',
    title: 'Waxing',
    action: 'Take Action',
    desc: 'Push forward. Build momentum and commit energy to your choices.',
  },
  {
    glyph: '\uD83C\uDF15',
    title: 'Full Moon',
    action: 'Gratitude',
    desc: 'Celebrate. Reflect on progress and give thanks for what has come to light.',
  },
  {
    glyph: '\uD83C\uDF18',
    title: 'Waning',
    action: 'Release Unwanted',
    desc: 'Let go. Clear away what no longer serves you before the next cycle begins.',
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      <section className="flex max-w-3xl flex-col items-center py-16 text-center md:py-24">
        <span className="mb-4 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-medium uppercase tracking-widest text-primary">
          The Motive
        </span>
        <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
          Decide with the Tides of the Moon.
        </h1>
        <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
          Every decision has a season. Lunar Decider maps your choices to the
          rhythm of the lunar cycle, so you act when the timing is right.
        </p>
        <Link
          href="/moon-cycle"
          className={cn(
            buttonVariants({ size: 'lg' }),
            'mt-8 h-11 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90',
          )}
        >
          Track Your Moon
        </Link>
      </section>

      <section className="grid w-full max-w-4xl gap-4 pb-16 sm:grid-cols-2">
        {phases.map((phase) => (
          <div
            key={phase.title}
            className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
          >
            <div className="text-4xl" aria-hidden="true">
              {phase.glyph}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              {phase.title} <span className="text-primary">= {phase.action}</span>
            </h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{phase.desc}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
