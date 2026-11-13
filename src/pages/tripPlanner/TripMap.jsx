import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Loader2, AlertTriangle } from 'lucide-react'
import { geocodePlaces } from './geocode'
import { getRoutePath } from './routing'
import styles from './TripMap.module.css'

function markerIcon(color) {
  return L.divIcon({
    className: styles.markerIcon,
    html: `<span style="background:${color}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

export default function TripMap({ stages }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [unresolved, setUnresolved] = useState([])

  useEffect(() => {
    if (!containerRef.current) return undefined
    const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView([44.5, 17.5], 6)
    mapRef.current = map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)
    return () => { map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    let cancelled = false
    const map = mapRef.current
    if (!map || stages.length === 0) return undefined

    setLoading(true)
    setUnresolved([])

    // Each stage's "country" describes its destination (used below for the
    // end point and for the day's color) — the place it's departing FROM is
    // wherever the previous stage ended, which can be a different country on
    // a border-crossing day. So only the end points get geocoded per-stage;
    // a leg's start is simply chained from the previous leg's resolved end,
    // instead of re-geocoding the same place under the wrong country.
    const endQueries = stages.map(s => s.endPoint ? `${s.endPoint}, ${s.country || ''}`.trim() : null)
    const firstStartQuery = stages[0]?.startPoint
      ? `${stages[0].startPoint}, ${stages[0].country || ''}`.trim()
      : null
    const uniqueQueries = [...new Set([firstStartQuery, ...endQueries].filter(Boolean))]

    geocodePlaces(uniqueQueries).then(async coordsByQuery => {
      if (cancelled) return

      map.eachLayer(layer => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer)
      })

      const missing = []
      const bounds = []
      const legs = []

      if (firstStartQuery && !coordsByQuery[firstStartQuery]) missing.push(stages[0].startPoint)
      let prevEndCoords = firstStartQuery ? coordsByQuery[firstStartQuery] : null
      if (prevEndCoords) bounds.push([prevEndCoords.lat, prevEndCoords.lng])

      stages.forEach((s, i) => {
        const endQuery = endQueries[i]
        const endCoords = endQuery ? coordsByQuery[endQuery] : null
        if (endQuery && !endCoords) missing.push(s.endPoint)

        const startCoords = prevEndCoords
        if (startCoords && endCoords) legs.push({ stage: s, startCoords, endCoords })

        if (endCoords) {
          L.marker([endCoords.lat, endCoords.lng], { icon: markerIcon(s.colorStart) })
            .bindPopup(`<strong>Dan ${s.dayNumber}: ${s.endPoint}</strong><br/>${s.country || ''}<br/>${s.distance} km`)
            .addTo(map)
          bounds.push([endCoords.lat, endCoords.lng])
        }

        prevEndCoords = endCoords ?? null
      })

      if (bounds.length) map.fitBounds(bounds, { padding: [30, 30] })
      setUnresolved([...new Set(missing)])
      setLoading(false)

      for (const { stage, startCoords, endCoords } of legs) {
        if (cancelled) return
        const path = await getRoutePath(startCoords, endCoords)
        if (cancelled) return
        L.polyline(
          path || [[startCoords.lat, startCoords.lng], [endCoords.lat, endCoords.lng]],
          { color: stage.colorStart, weight: 4, opacity: 0.85 }
        ).addTo(map)
      }
    })

    return () => { cancelled = true }
  }, [stages])

  return (
    <div className={styles.mapCard}>
      {loading && (
        <div className={styles.mapOverlay}>
          <Loader2 size={24} className={styles.spin} /> Učitavanje lokacija...
        </div>
      )}
      {!loading && unresolved.length > 0 && (
        <div className={styles.mapWarning}>
          <AlertTriangle size={14} /> Nije pronađeno na mapi: {unresolved.join(', ')}
        </div>
      )}
      <div ref={containerRef} className={styles.mapContainer} />
    </div>
  )
}
