const CACHE_KEY = 'tripPlanner.routeCache.v3'
const MIN_GAP_MS = 400

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

function round(n) { return Math.round(n * 10000) / 10000 }

function keyFor(a, b) {
  return `${round(a.lat)},${round(a.lng)}|${round(b.lat)},${round(b.lng)}`
}

let lastRequestAt = 0

async function fetchRoute(a, b) {
  const now = Date.now()
  const wait = Math.max(0, MIN_GAP_MS - (now - lastRequestAt))
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  lastRequestAt = Date.now()

  // OSRM's public "cycling" profile still picked roads right alongside the
  // Belgrade bypass motorway on real trips, since it's weight/speed optimized
  // rather than tuned for touring comfort. BRouter's "trekking" profile is
  // built for exactly this (bike touring, avoids busy/fast roads) and its
  // public server allows CORS, so no API key or backend is needed.
  const url = `https://brouter.de/brouter?lonlats=${a.lng},${a.lat}|${b.lng},${b.lat}&profile=trekking&alternativeidx=0&format=geojson`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Routing failed: ${res.status}`)
  const data = await res.json()
  const coords = data.features?.[0]?.geometry?.coordinates
  if (!coords?.length) return null
  return coords.map(([lng, lat]) => [lat, lng])
}

/**
 * Resolves a road-following path between two points via BRouter's public
 * trekking profile, caching results in localStorage. Returns null (caller
 * should fall back to a straight line) if no route can be found or the
 * request fails.
 */
export async function getRoutePath(a, b) {
  const cache = loadCache()
  const key = keyFor(a, b)
  if (cache[key] !== undefined) return cache[key]

  try {
    const path = await fetchRoute(a, b)
    cache[key] = path
    saveCache(cache)
    return path
  } catch {
    cache[key] = null
    saveCache(cache)
    return null
  }
}
