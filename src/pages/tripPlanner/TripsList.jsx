import { useState } from 'react'
import { PlusCircle, X, Pencil, Trash2, Milestone, Mountain, Flag, CalendarRange, Bike } from 'lucide-react'
import styles from './TripsList.module.css'

const emptyForm = { name: '', startDate: '2027-05-01' }

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function parseLocalDate(value) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function tripStats(trip) {
  const stages = trip.stages || []
  const distance = stages.reduce((sum, s) => sum + (Number(s.distance) || 0), 0)
  const elevation = stages.reduce((sum, s) => sum + (Number(s.elevationGain) || 0), 0)
  const maxDay = stages.length ? Math.max(...stages.map(s => s.dayNumber)) : 0
  const start = parseLocalDate(trip.startDate)
  const end = maxDay ? addDays(start, maxDay - 1) : null

  const byCountry = new Map()
  stages.forEach(s => {
    const key = (s.country || '').trim()
    if (key && !byCountry.has(key.toLowerCase())) {
      byCountry.set(key.toLowerCase(), { country: key, colorStart: s.colorStart || '#64748b', colorEnd: s.colorEnd || '#94a3b8' })
    }
  })

  return { distance, elevation, count: stages.length, start, end, countries: [...byCountry.values()] }
}

export default function TripsList({ trips, onSelect, onCreate, onUpdate, onDelete }) {
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState(null)

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }))

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setFormError(null)
    setShowModal(true)
  }

  const openEdit = (e, trip) => {
    e.stopPropagation()
    setForm({ name: trip.name, startDate: trip.startDate })
    setEditingId(trip.id)
    setFormError(null)
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setFormError(null) }

  const handleDelete = (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Obrisati ovo putovanje i sve njegove etape?')) return
    onDelete(id)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Naziv putovanja je obavezan.'); return }
    if (editingId) {
      onUpdate(editingId, { name: form.name.trim(), startDate: form.startDate })
    } else {
      onCreate({ name: form.name.trim(), startDate: form.startDate })
    }
    setShowModal(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2>Trip Planner</h2>
          <span className={styles.breadcrumb}>Home / Sport / MySport / Trip Planner</span>
        </div>
        <button className={styles.addBtn} onClick={openCreate}>
          <PlusCircle size={16} /> Novo putovanje
        </button>
      </div>

      {trips.length === 0 ? (
        <div className={styles.stateBox}>
          <Bike size={40} />
          <span>Nema isplaniranih putovanja. Dodajte prvo da biste započeli.</span>
        </div>
      ) : (
        <div className={styles.grid}>
          {trips.map(trip => {
            const stats = tripStats(trip)
            return (
              <div key={trip.id} className={styles.card} onClick={() => onSelect(trip.id)}>
                <div className={styles.cardHeader}>
                  <h3>{trip.name}</h3>
                  <div className={styles.cardActions}>
                    <button className={styles.iconBtn} onClick={(e) => openEdit(e, trip)} title="Izmeni">
                      <Pencil size={14} />
                    </button>
                    <button className={styles.iconBtn} onClick={(e) => handleDelete(e, trip.id)} title="Obriši">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className={styles.cardPeriod}>
                  <CalendarRange size={13} />
                  {stats.start.toLocaleDateString('sr-RS')}{stats.end ? ` – ${stats.end.toLocaleDateString('sr-RS')}` : ''}
                </div>

                {stats.countries.length > 0 && (
                  <div className={styles.swatchRow}>
                    {stats.countries.map(c => (
                      <span
                        key={c.country}
                        className={styles.swatch}
                        style={{ background: `linear-gradient(135deg, ${c.colorStart}, ${c.colorEnd})` }}
                        title={c.country}
                      />
                    ))}
                  </div>
                )}

                <div className={styles.cardStats}>
                  <div className={styles.cardStat}>
                    <Milestone size={15} className={styles.cardStatIcon} />
                    <span>{stats.distance.toLocaleString('en-US')} km</span>
                  </div>
                  <div className={styles.cardStat}>
                    <Mountain size={15} className={styles.cardStatIcon} />
                    <span>{stats.elevation.toLocaleString('en-US')} m</span>
                  </div>
                  <div className={styles.cardStat}>
                    <Flag size={15} className={styles.cardStatIcon} />
                    <span>{stats.count} etapa</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingId ? 'Izmeni putovanje' : 'Novo putovanje'}</h3>
              <button className={styles.closeBtn} onClick={closeModal}><X size={18} /></button>
            </div>
            {formError && <div className={styles.formError}>{formError}</div>}
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Naziv *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="npr. Balkan ride 2027" autoFocus />
              </div>
              <div className={styles.formGroup}>
                <label>Početni datum</label>
                <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Otkaži</button>
                <button type="submit" className={styles.submitBtn}>
                  <PlusCircle size={15} /> {editingId ? 'Sačuvaj' : 'Napravi putovanje'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
