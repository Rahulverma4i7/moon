// app/api/route.ts
import { NextResponse } from 'next/server'
import { getLunarAge, getPhaseFactor } from '@/lib/moonCalc'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date')
  const date = dateParam ? new Date(dateParam) : new Date()

  // 1. Validate the date
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  // 2. Try the REAL external API first (using .env.local)
  try {
    const apiKey = process.env.ASTRO_API_KEY
    const lat = process.env.LATITUDE
    const lon = process.env.LONGITUDE

    // If keys are missing, skip API and go straight to fallback
    if (!apiKey || !lat || !lon) {
      throw new Error('Environment variables missing')
    }

    const formattedDate = date.toISOString().split('T')[0] // YYYY-MM-DD
    const url = `https://api.ipgeolocation.io/v3/astronomy?apiKey=${apiKey}&lat=${lat}&lon=${lon}&date=${formattedDate}`

    const response = await fetch(url, {
      // Cache on Vercel for 1 hour to avoid hitting rate limits on multiple requests
      next: { revalidate: 3600 }
    })

    // If API responds with 429 (Too Many Requests) or 403 (Quota exceeded), we fallback
    if (!response.ok) {
      console.warn(`API returned ${response.status}. Falling back to hardcoded math.`)
      throw new Error('API rate limit or error')
    }

    const data = await response.json()

    // IPGeolocation returns moon_phase as string like "NEW_MOON", "WAXING_GIBBOUS", etc.
    // We map it to a numeric factor (0 to 1) for your CSS shadow logic.
    // Let's use their "moon_phase" string to keep it accurate.
    return NextResponse.json({
      source: 'ipgeolocation.io',
      phase: mapPhaseStringToFactor(data.moon_phase),
      age: data.moon_age_days || getLunarAge(date), // fallback age if missing
      illumination: data.moon_illumination_percentage,
    })

  } catch (error) {
    // 3. FALLBACK: If ANYTHING goes wrong with the API, use the hardcoded math.
    console.warn('External API failed. Using pure math fallback.', error)
    
    return NextResponse.json({
      source: 'hardcoded-math',
      phase: getPhaseFactor(date),
      age: getLunarAge(date),
    })
  }
}

/**
 * Helper function: Map IPGeolocation's string phase to a 0-1 factor
 * so your frontend MoonDisplay component renders correctly.
 */
function mapPhaseStringToFactor(phase: string): number {
  const map: Record<string, number> = {
    'NEW_MOON': 0,
    'WAXING_CRESCENT': 0.125,
    'FIRST_QUARTER': 0.25,
    'WAXING_GIBBOUS': 0.375,
    'FULL_MOON': 0.5,
    'WANING_GIBBOUS': 0.625,
    'LAST_QUARTER': 0.75,
    'WANING_CRESCENT': 0.875,
  }
  return map[phase] ?? 0.5 // default to Full Moon if string is unrecognized
}