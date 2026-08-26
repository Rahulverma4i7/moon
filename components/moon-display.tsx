'use client'

interface MoonDisplayProps {
  /** phase factor between 0 (new moon) and 1 (next new moon) */
  phase: number
}

export function MoonDisplay({ phase }: MoonDisplayProps) {
  // Move the transparent "lit" window across the disc as the phase progresses.
  // 0   -> new moon    (shadow centered, fully dark)
  // 0.5 -> full moon   (window off screen, fully lit)
  // 1   -> new moon    (shadow centered again)
  const shadowShift = 50 - phase * 100
  const clampedShift = Math.max(0, Math.min(100, shadowShift))

  const maskStyle: React.CSSProperties = {
    maskImage: `radial-gradient(circle at ${clampedShift}% 50%, transparent 45%, black 55%)`,
    WebkitMaskImage: `radial-gradient(circle at ${clampedShift}% 50%, transparent 45%, black 55%)`,
  }

  return (
    <div className="relative h-64 w-64 md:h-80 md:w-80">
      {/* Faint full-moon ghost so the dark side reads as a sphere, not empty space */}
      <img
        src="/moon-base.png"
        alt=""
        aria-hidden="true"
        crossOrigin="anonymous"
        className="animate-moon-spin absolute inset-0 h-full w-full rounded-full object-cover opacity-10"
      />
      {/* Lit portion revealed by the dynamic radial-gradient mask */}
      <div className="absolute inset-0 overflow-hidden rounded-full" style={maskStyle}>
        {/* NOTE: Place a 512x512 high-res full moon PNG at /public/moon-base.png */}
        <img
          src="/moon-base.png"
          alt="Current phase of the moon"
          crossOrigin="anonymous"
          className="animate-moon-spin h-full w-full object-cover"
        />
        {/* Color-cycling tint through the natural lunar hues.
            mix-blend-mode: color keeps the crater detail while shifting hue. */}
        <div
          className="animate-moon-tint pointer-events-none absolute inset-0"
          style={{ mixBlendMode: 'color', opacity: 0.65 }}
        />
      </div>
      {/* Soft glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ boxShadow: '0 0 80px 10px rgba(251, 191, 36, 0.15)' }}
      />
    </div>
  )
}
