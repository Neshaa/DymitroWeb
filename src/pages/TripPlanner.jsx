import { useState, useEffect } from 'react'
import TripsList from './tripPlanner/TripsList'
import TripDetail from './tripPlanner/TripDetail'
import { loadTrips, saveTrips } from './tripPlanner/storage'

export default function TripPlanner() {
  const [trips, setTrips] = useState(loadTrips)
  const [selectedTripId, setSelectedTripId] = useState(null)

  useEffect(() => { saveTrips(trips) }, [trips])

  const handleCreate = ({ name, startDate }) => {
    const trip = { id: Date.now(), name, startDate, stages: [] }
    setTrips(prev => [...prev, trip])
    setSelectedTripId(trip.id)
  }

  const handleUpdate = (id, patch) => {
    setTrips(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
  }

  const handleDelete = (id) => {
    setTrips(prev => prev.filter(t => t.id !== id))
    if (selectedTripId === id) setSelectedTripId(null)
  }

  const selectedTrip = trips.find(t => t.id === selectedTripId)

  if (selectedTrip) {
    return (
      <TripDetail
        trip={selectedTrip}
        onBack={() => setSelectedTripId(null)}
        onUpdateTrip={(updatedTrip) => handleUpdate(updatedTrip.id, updatedTrip)}
      />
    )
  }

  return (
    <TripsList
      trips={trips}
      onSelect={setSelectedTripId}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  )
}
