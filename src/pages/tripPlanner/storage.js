const TRIPS_KEY = 'tripPlanner.trips.v2'
const LEGACY_STAGES_KEY = 'tripPlanner.stages'
const LEGACY_START_DATE_KEY = 'tripPlanner.startDate'

export const DEFAULT_START_DATE = '2027-05-01'

const DEMO_STAGES = [
  { id: 1, dayNumber: 1, startPoint: 'Beograd', endPoint: 'Loznica', country: 'Srbija', distance: 129, elevationGain: 765, colorStart: '#0f766e', colorEnd: '#2dd4bf' },
  { id: 2, dayNumber: 2, startPoint: 'Loznica', endPoint: 'Doboj', country: 'Bosna i Hercegovina', distance: 133, elevationGain: 1100, colorStart: '#1e3a8a', colorEnd: '#3b82f6' },
  { id: 3, dayNumber: 3, startPoint: 'Doboj', endPoint: 'Banja Luka', country: 'Bosna i Hercegovina', distance: 93, elevationGain: 600, colorStart: '#1e3a8a', colorEnd: '#3b82f6' },
  { id: 4, dayNumber: 4, startPoint: 'Banja Luka', endPoint: 'Bosanska Krupa', country: 'Bosna i Hercegovina', distance: 111, elevationGain: 850, colorStart: '#1e3a8a', colorEnd: '#3b82f6' },
  { id: 5, dayNumber: 5, startPoint: 'Bosanska Krupa', endPoint: 'Otočac', country: 'Hrvatska', distance: 98, elevationGain: 980, colorStart: '#b91c1c', colorEnd: '#f87171' },
  { id: 6, dayNumber: 6, startPoint: 'Otočac', endPoint: 'Rijeka', country: 'Hrvatska', distance: 100, elevationGain: 450, colorStart: '#b91c1c', colorEnd: '#f87171' },
]

function demoTrip() {
  return [{ id: 1, name: 'Balkan ride 2027', startDate: DEFAULT_START_DATE, stages: DEMO_STAGES }]
}

function legacyCountryColor(country) {
  const PALETTE = [
    ['#2563eb', '#60a5fa'], ['#c1121f', '#f87171'], ['#2f6b3a', '#4ade80'], ['#7c3aed', '#a78bfa'],
    ['#b5540a', '#fb923c'], ['#0f766e', '#2dd4bf'], ['#a3195b', '#f472b6'], ['#1e3a8a', '#3b82f6'],
  ]
  if (!country || !country.trim()) return ['#64748b', '#94a3b8']
  const key = country.trim().toLowerCase()
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

function migrateLegacy() {
  try {
    const raw = localStorage.getItem(LEGACY_STAGES_KEY)
    if (!raw) return null
    const stages = JSON.parse(raw)
    const startDate = localStorage.getItem(LEGACY_START_DATE_KEY) || DEFAULT_START_DATE
    const coloredStages = stages.map(s => {
      const [colorStart, colorEnd] = legacyCountryColor(s.country)
      return { ...s, colorStart: s.colorStart || colorStart, colorEnd: s.colorEnd || colorEnd }
    })
    const trips = [{ id: Date.now(), name: 'Moje putovanje', startDate, stages: coloredStages }]
    saveTrips(trips)
    localStorage.removeItem(LEGACY_STAGES_KEY)
    localStorage.removeItem(LEGACY_START_DATE_KEY)
    return trips
  } catch {
    return null
  }
}

export function loadTrips() {
  try {
    const raw = localStorage.getItem(TRIPS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore malformed storage */ }
  const migrated = migrateLegacy()
  if (migrated) return migrated
  return demoTrip()
}

export function saveTrips(trips) {
  try { localStorage.setItem(TRIPS_KEY, JSON.stringify(trips)) } catch { /* storage unavailable */ }
}
