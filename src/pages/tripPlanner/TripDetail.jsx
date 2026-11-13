import { useState, useMemo } from 'react'
import {
  Map as MapIcon, CalendarDays, List, PlusCircle, X, Pencil, Trash2,
  MapPin, Flag, Mountain, Milestone, AlertCircle, ArrowLeft,
} from 'lucide-react'
import TripMap from './TripMap'
import styles from './TripDetail.module.css'

const WEEKDAYS = ['PON', 'UTO', 'SRE', 'ČET', 'PET', 'SUB', 'NED']
const MONTHS = [
  'januar', 'februar', 'mart', 'april', 'maj', 'jun',
  'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar',
]

const emptyForm = {
  dayNumber: '',
  startPoint: '',
  endPoint: '',
  country: '',
  distance: '',
  elevationGain: '',
  colorStart: '#2563eb',
  colorEnd: '#60a5fa',
}

function pad2(n) { return String(n).padStart(2, '0') }

function dateKey(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` }

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function parseLocalDate(value) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function buildMonthGrid(year, monthIndex) {
  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, monthIndex, 0).getDate()

  const cells = []
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, monthIndex - 1, daysInPrevMonth - i), outside: true })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, monthIndex, d), outside: false })
  }
  const trailing = (7 - (cells.length % 7)) % 7
  for (let d = 1; d <= trailing; d++) {
    cells.push({ date: new Date(year, monthIndex + 1, d), outside: true })
  }
  return cells
}

export default function TripDetail({ trip, onBack, onUpdateTrip }) {
  const [view, setView] = useState('calendar')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState(null)

  const stages = trip.stages
  const startDateStr = trip.startDate

  const setStages = (updater) => {
    const next = typeof updater === 'function' ? updater(stages) : updater
    onUpdateTrip({ ...trip, stages: next })
  }
  const setStartDateStr = (value) => onUpdateTrip({ ...trip, startDate: value })

  const startDate = useMemo(() => parseLocalDate(startDateStr), [startDateStr])

  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => a.dayNumber - b.dayNumber),
    [stages]
  )

  const stageMeta = useMemo(() => {
    let running = 0
    return sortedStages.map(s => {
      running += Number(s.distance) || 0
      return { ...s, date: addDays(startDate, s.dayNumber - 1), total: running }
    })
  }, [sortedStages, startDate])

  const stageByKey = useMemo(() => {
    const map = new Map()
    stageMeta.forEach(s => map.set(dateKey(s.date), s))
    return map
  }, [stageMeta])

  const knownCountries = useMemo(() => {
    const byCountry = new Map()
    sortedStages.forEach(s => {
      const key = (s.country || '').trim()
      if (key && !byCountry.has(key.toLowerCase())) {
        byCountry.set(key.toLowerCase(), { country: key, colorStart: s.colorStart, colorEnd: s.colorEnd })
      }
    })
    return [...byCountry.values()]
  }, [sortedStages])

  const totals = useMemo(() => ({
    distance: stageMeta.reduce((sum, s) => sum + (Number(s.distance) || 0), 0),
    elevation: stageMeta.reduce((sum, s) => sum + (Number(s.elevationGain) || 0), 0),
    count: stageMeta.length,
    maxDistance: Math.max(1, ...stageMeta.map(s => Number(s.distance) || 0)),
    maxElevation: Math.max(1, ...stageMeta.map(s => Number(s.elevationGain) || 0)),
  }), [stageMeta])

  const endDate = stageMeta.length ? stageMeta[stageMeta.length - 1].date : null

  const months = useMemo(() => {
    const list = []
    const first = { y: startDate.getFullYear(), m: startDate.getMonth() }
    const last = endDate ? { y: endDate.getFullYear(), m: endDate.getMonth() } : first
    let y = first.y, m = first.m
    while (y < last.y || (y === last.y && m <= last.m)) {
      list.push({ year: y, monthIndex: m })
      m++
      if (m > 11) { m = 0; y++ }
    }
    return list
  }, [startDate, endDate])

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }))

  const openCreate = () => {
    const nextDay = stages.length ? Math.max(...stages.map(s => s.dayNumber)) + 1 : 1
    const last = sortedStages[sortedStages.length - 1]
    setForm({
      ...emptyForm,
      dayNumber: String(nextDay),
      startPoint: last?.endPoint || '',
      country: last?.country || '',
      colorStart: last?.colorStart || emptyForm.colorStart,
      colorEnd: last?.colorEnd || emptyForm.colorEnd,
    })
    setEditingId(null)
    setFormError(null)
    setShowModal(true)
  }

  const openEdit = (stage) => {
    setForm({
      dayNumber: String(stage.dayNumber),
      startPoint: stage.startPoint || '',
      endPoint: stage.endPoint || '',
      country: stage.country || '',
      distance: stage.distance ?? '',
      elevationGain: stage.elevationGain ?? '',
      colorStart: stage.colorStart || emptyForm.colorStart,
      colorEnd: stage.colorEnd || emptyForm.colorEnd,
    })
    setEditingId(stage.id)
    setFormError(null)
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setFormError(null) }

  const applyCountryPreset = (preset) => {
    setForm(p => ({ ...p, country: preset.country, colorStart: preset.colorStart, colorEnd: preset.colorEnd }))
  }

  const handleDelete = (id) => {
    if (!window.confirm('Obrisati ovu etapu?')) return
    setStages(prev => prev.filter(s => s.id !== id))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const dayNumber = Number(form.dayNumber)
    if (!dayNumber || dayNumber < 1) { setFormError('Unesite validan broj dana.'); return }
    if (!form.endPoint.trim()) { setFormError('Krajnja tačka je obavezna.'); return }
    const duplicate = stages.some(s => s.dayNumber === dayNumber && s.id !== editingId)
    if (duplicate) { setFormError(`Dan ${dayNumber} je već zauzet.`); return }

    const payload = {
      dayNumber,
      startPoint: form.startPoint.trim(),
      endPoint: form.endPoint.trim(),
      country: form.country.trim(),
      distance: Number(form.distance) || 0,
      elevationGain: Number(form.elevationGain) || 0,
      colorStart: form.colorStart,
      colorEnd: form.colorEnd,
    }

    if (editingId) {
      setStages(prev => prev.map(s => s.id === editingId ? { ...s, ...payload } : s))
    } else {
      setStages(prev => [...prev, { id: Date.now(), ...payload }])
    }
    setShowModal(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <button className={styles.backBtn} onClick={onBack}>
            <ArrowLeft size={14} /> Sva putovanja
          </button>
          <h2>{trip.name}</h2>
          <span className={styles.breadcrumb}>Home / Sport / MySport / Trip Planner / {trip.name}</span>
        </div>
        <div className={styles.headerActions}>
          <label className={styles.startDateField}>
            <span>Početak</span>
            <input type="date" value={startDateStr} onChange={e => setStartDateStr(e.target.value)} />
          </label>
          <div className={styles.viewSwitch}>
            <button
              className={`${styles.switchBtn} ${view === 'calendar' ? styles.switchBtnActive : ''}`}
              onClick={() => setView('calendar')}
            >
              <CalendarDays size={15} /> Kalendar
            </button>
            <button
              className={`${styles.switchBtn} ${view === 'list' ? styles.switchBtnActive : ''}`}
              onClick={() => setView('list')}
            >
              <List size={15} /> Lista
            </button>
            <button
              className={`${styles.switchBtn} ${view === 'map' ? styles.switchBtnActive : ''}`}
              onClick={() => setView('map')}
            >
              <MapIcon size={15} /> Mapa
            </button>
          </div>
          <button className={styles.addBtn} onClick={openCreate}>
            <PlusCircle size={16} /> Dodaj etapu
          </button>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <Milestone size={18} className={styles.statIcon} />
          <div>
            <div className={styles.statValue}>{totals.distance.toLocaleString('en-US')} km</div>
            <div className={styles.statLabel}>Ukupna distanca</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <Mountain size={18} className={styles.statIcon} />
          <div>
            <div className={styles.statValue}>{totals.elevation.toLocaleString('en-US')} m</div>
            <div className={styles.statLabel}>Ukupan uspon</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <Flag size={18} className={styles.statIcon} />
          <div>
            <div className={styles.statValue}>{totals.count}</div>
            <div className={styles.statLabel}>Broj etapa</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <MapIcon size={18} className={styles.statIcon} />
          <div>
            <div className={styles.statValue}>
              {startDate.toLocaleDateString('sr-RS')} {endDate ? `– ${endDate.toLocaleDateString('sr-RS')}` : ''}
            </div>
            <div className={styles.statLabel}>Period putovanja</div>
          </div>
        </div>
      </div>

      {stageMeta.length === 0 ? (
        <div className={styles.stateBox}>
          <MapIcon size={40} />
          <span>Nema unetih etapa. Dodajte prvu etapu da biste započeli plan.</span>
        </div>
      ) : view === 'calendar' ? (
        <div className={styles.calendarWrap}>
          {months.map(({ year, monthIndex }) => (
            <div key={`${year}-${monthIndex}`} className={styles.monthBlock}>
              <div className={styles.monthHeader}>
                <span className={styles.monthYear}>{year}</span>
                <span className={styles.monthName}>{MONTHS[monthIndex]}</span>
              </div>
              <div className={styles.weekdayRow}>
                {WEEKDAYS.map(w => <div key={w} className={styles.weekdayCell}>{w}</div>)}
              </div>
              <div className={styles.daysGrid}>
                {buildMonthGrid(year, monthIndex).map(({ date, outside }) => {
                  const key = dateKey(date)
                  const stage = stageByKey.get(key)
                  const bg = stage ? `linear-gradient(135deg, ${stage.colorStart} 0%, ${stage.colorEnd} 100%)` : undefined
                  return (
                    <div
                      key={key}
                      className={`${styles.dayCell} ${outside ? styles.dayCellOutside : ''} ${stage ? styles.dayCellStage : ''}`}
                      style={bg ? { background: bg } : undefined}
                      onClick={stage ? () => openEdit(stage) : undefined}
                      title={stage ? `${stage.startPoint ? stage.startPoint + ' → ' : ''}${stage.endPoint} (${stage.country || 'N/A'})` : undefined}
                    >
                      <span className={styles.dayNumber}>{date.getDate()}</span>
                      {stage && (
                        <div className={styles.dayStageInfo}>
                          <span className={styles.dayCity}>{stage.endPoint}</span>
                          <span className={styles.dayDistance}>{stage.distance} km</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : view === 'list' ? (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ruta</th>
                  <th>Zemlja</th>
                  <th>Dužina</th>
                  <th>Uspon</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stageMeta.map((s, i) => {
                  const prev = stageMeta[i - 1]
                  const groupChanged = i === 0 || (prev && (prev.country || '').toLowerCase() !== (s.country || '').toLowerCase())
                  const distPct = Math.round((Number(s.distance) / totals.maxDistance) * 100)
                  const elevPct = Math.round((Number(s.elevationGain) / totals.maxElevation) * 100)
                  const gradient = `linear-gradient(90deg, ${s.colorStart}, ${s.colorEnd})`
                  return (
                    <tr key={s.id} className={groupChanged ? styles.groupStart : ''}>
                      <td className={styles.dayCell2}>{pad2(s.dayNumber)}</td>
                      <td>
                        <div className={styles.routeCell}>
                          <span className={styles.routeEnd}>
                            <MapPin size={13} style={{ color: s.colorStart }} /> {s.endPoint}
                          </span>
                          {s.startPoint && <span className={styles.routeStart}>iz: {s.startPoint}</span>}
                        </div>
                      </td>
                      <td>
                        <span className={styles.countryBadge} style={{ background: gradient }}>{s.country || '—'}</span>
                      </td>
                      <td>
                        <div className={styles.barRow}>
                          <div className={styles.barTrack}>
                            <div className={styles.barFillDistance} style={{ width: `${distPct}%` }} />
                          </div>
                          <span className={styles.barValue}>{s.distance}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.barRow}>
                          <div className={styles.barTrack}>
                            <div className={styles.barFillElevation} style={{ width: `${elevPct}%` }} />
                          </div>
                          <span className={styles.barValue}>{s.elevationGain}</span>
                        </div>
                      </td>
                      <td className={styles.totalCell}>{s.total.toLocaleString('en-US')}</td>
                      <td className={styles.rowActions}>
                        <button className={styles.iconBtn} onClick={() => openEdit(s)} title="Izmeni">
                          <Pencil size={14} />
                        </button>
                        <button className={styles.iconBtn} onClick={() => handleDelete(s.id)} title="Obriši">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <TripMap stages={stageMeta} />
      )}

      {showModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingId ? 'Izmeni etapu' : 'Nova etapa'}</h3>
              <button className={styles.closeBtn} onClick={closeModal}><X size={18} /></button>
            </div>
            {formError && (
              <div className={styles.formError}>
                <AlertCircle size={15} /> {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              {knownCountries.length > 0 && (
                <div className={styles.presetRow}>
                  <span className={styles.presetLabel}>Već korišćene zemlje:</span>
                  <div className={styles.presetChips}>
                    {knownCountries.map(preset => (
                      <button
                        type="button"
                        key={preset.country}
                        className={styles.presetChip}
                        style={{ background: `linear-gradient(90deg, ${preset.colorStart}, ${preset.colorEnd})` }}
                        onClick={() => applyCountryPreset(preset)}
                      >
                        {preset.country}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Dan *</label>
                  <input type="number" min="1" step="1" value={form.dayNumber} onChange={e => set('dayNumber', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Zemlja</label>
                  <input value={form.country} onChange={e => set('country', e.target.value)} placeholder="npr. Hrvatska" />
                </div>
                <div className={styles.formGroup}>
                  <label>Početna tačka</label>
                  <input value={form.startPoint} onChange={e => set('startPoint', e.target.value)} placeholder="npr. Rijeka" />
                </div>
                <div className={styles.formGroup}>
                  <label>Krajnja tačka *</label>
                  <input value={form.endPoint} onChange={e => set('endPoint', e.target.value)} placeholder="npr. Trst" />
                </div>
                <div className={styles.formGroup}>
                  <label>Distanca (km)</label>
                  <input type="number" step="any" value={form.distance} onChange={e => set('distance', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Uspon (m)</label>
                  <input type="number" step="1" value={form.elevationGain} onChange={e => set('elevationGain', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Boja 1 (gradient)</label>
                  <div className={styles.colorRow}>
                    <input type="color" value={form.colorStart} onChange={e => set('colorStart', e.target.value)} />
                    <span className={styles.colorHex}>{form.colorStart}</span>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Boja 2 (gradient)</label>
                  <div className={styles.colorRow}>
                    <input type="color" value={form.colorEnd} onChange={e => set('colorEnd', e.target.value)} />
                    <span className={styles.colorHex}>{form.colorEnd}</span>
                  </div>
                </div>
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label>Pregled boje ćelije</label>
                  <div className={styles.colorPreview} style={{ background: `linear-gradient(135deg, ${form.colorStart}, ${form.colorEnd})` }} />
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Otkaži</button>
                <button type="submit" className={styles.submitBtn}>
                  <PlusCircle size={15} /> {editingId ? 'Sačuvaj' : 'Dodaj etapu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
