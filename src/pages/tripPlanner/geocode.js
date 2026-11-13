const CACHE_KEY = 'tripPlanner.geocodeCache'
const MIN_GAP_MS = 1100

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)) } catch { /* storage unavailable */ }
}

let lastRequestAt = 0

async function fetchCoordinates(query) {
  const now = Date.now()
  const wait = Math.max(0, MIN_GAP_MS - (now - lastRequestAt))
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  lastRequestAt = Date.now()

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`)
  const data = await res.json()
  if (!data.length) return null
  return { lat: Number(data[0].lat), lng: Number(data[0].lon) }
}

/**
 * Resolves lat/lng for each unique "place, country" query, using a localStorage
 * cache so repeat visits don't hit Nominatim again. Queries not yet cached are
 * looked up sequentially (Nominatim's usage policy caps bulk use at ~1 req/sec).
 */
export async function geocodePlaces(queries) {
  const cache = loadCache()
  const results = {}
  const unresolved = []

  for (const query of queries) {
    const key = query.trim().toLowerCase()
    if (cache[key] !== undefined) {
      results[query] = cache[key]
    } else {
      unresolved.push(query)
    }
  }

  for (const query of unresolved) {
    const key = query.trim().toLowerCase()
    try {
      const coords = await fetchCoordinates(query)
      cache[key] = coords
      results[query] = coords
    } catch {
      cache[key] = null
      results[query] = null
    }
  }

  if (unresolved.length) saveCache(cache)
  return results
}
