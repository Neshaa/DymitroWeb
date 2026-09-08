import { useState, useEffect, useMemo } from 'react'
import { Loader2, AlertCircle, RefreshCw, Bike, PlusCircle, X, CheckCircle } from 'lucide-react'
import styles from './Bicycle.module.css'

const API_URL = 'https://dymitroapi.onrender.com/SportActivity'

const emptyForm = {
  name: '',
  ddate: '',
  duration: '',
  distance: '',
  elevationGain: '',
  elevationLoss: '',
  avgSpeed: '',
  maxSpeed: '',
  movingTime: '',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const day = String(d.getDate()).padStart(2, '0')
  const month = MONTHS[d.getMonth()]
  const year = String(d.getFullYear()).slice(-2)
  return `${day}-${month}-${year}`
}

function dateCategory(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  if (d.getFullYear() === now.getFullYear()) return 'current'
  const oneYearAgo = new Date(now)
  oneYearAgo.setFullYear(now.getFullYear() - 1)
  return d >= oneYearAgo ? 'recent' : 'older'
}

function groupByDate(list) {
  const groups = new Map()
  list.forEach((a, idx) => {
    const key = a.ddate ? new Date(a.ddate).toISOString().slice(0, 10) : `no-date-${idx}`
    if (!groups.has(key)) groups.set(key, { ddate: a.ddate, distance: 0, elevationGain: 0, items: [] })
    const g = groups.get(key)
    g.distance += Number(a.distance) || 0
    g.elevationGain += Number(a.elevationGain) || 0
    g.items.push(a)
  })
  return [...groups.values()].map((g, idx) => {
    const items = [...g.items].sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0))
    return {
      id: items[0]?.id ?? idx,
      ddate: g.ddate,
      distance: g.distance,
      elevationGain: g.elevationGain,
      name: items.map(a => a.name ?? '—').join(' / '),
    }
  })
}

function groupByYear(list) {
  const groups = new Map()
  list.forEach(a => {
    if (!a.ddate) return
    const d = new Date(a.ddate)
    if (Number.isNaN(d.getTime())) return
    const year = d.getFullYear()
    if (!groups.has(year)) groups.set(year, { year, distance: 0, elevationGain: 0 })
    const g = groups.get(year)
    g.distance += Number(a.distance) || 0
    g.elevationGain += Number(a.elevationGain) || 0
  })
  return [...groups.values()].sort((a, b) => a.year - b.year)
}

// Round up to a "clean" axis max (1/2/5 x 10^n) so gridline labels read as whole numbers.
function niceMax(value) {
  if (value <= 0) return 1
  const exp = Math.floor(Math.log10(value))
  const base = Math.pow(10, exp)
  const fraction = value / base
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10
  return niceFraction * base
}

function YearBarChart({ title, unit, data, field, color }) {
  const [hovered, setHovered] = useState(null)
  const width = 520
  const height = 200
  const padLeft = 44
  const padRight = 12
  const padTop = 24
  const padBottom = 28
  const plotW = width - padLeft - padRight
  const plotH = height - padTop - padBottom

  const max = niceMax(Math.max(...data.map(d => d[field]), 0))
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(max * f))
  const barSlot = data.length ? plotW / data.length : plotW
  const barWidth = Math.min(28, barSlot * 0.55)

  const formatValue = v => Math.round(v).toLocaleString('en-US')

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>{title}</div>
      {data.length === 0 ? (
        <div className={styles.chartEmpty}>No data</div>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg} role="img" aria-label={title}>
          {ticks.map(t => {
            const y = padTop + plotH - (max ? (t / max) * plotH : 0)
            return (
              <g key={t}>
                <line x1={padLeft} y1={y} x2={width - padRight} y2={y} className={styles.chartGridline} />
                <text x={padLeft - 8} y={y} textAnchor="end" dominantBaseline="middle" className={styles.chartAxisLabel}>
                  {t.toLocaleString('en-US')}
                </text>
              </g>
            )
          })}
          {data.map((d, i) => {
            const v = d[field]
            const barH = max ? (v / max) * plotH : 0
            const slotX = padLeft + i * barSlot
            const x = slotX + (barSlot - barWidth) / 2
            const y = padTop + plotH - barH
            const isHovered = hovered === i
            return (
              <g key={d.year}>
                <rect
                  x={slotX}
                  y={padTop}
                  width={barSlot}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                />
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barH, 1)}
                  rx={4}
                  fill={color}
                  opacity={isHovered ? 1 : 0.85}
                  style={{ pointerEvents: 'none', transition: 'opacity 0.15s' }}
                />
                {isHovered && (
                  <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className={styles.chartValueLabel}>
                    {formatValue(v)}{unit}
                  </text>
                )}
                <text x={slotX + barSlot / 2} y={height - 8} textAnchor="middle" className={styles.chartAxisLabel}>
                  {d.year}
                </text>
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}

export default function Bicycle() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const fetchActivities = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(API_URL)
      if (!res.ok) throw new Error(`Error: ${res.status}`)
      const data = await res.json()
      setActivities(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchActivities() }, [])

  const sortedByDistance = groupByDate(activities).sort((a, b) => (b.distance ?? 0) - (a.distance ?? 0))
  const yearlyData = useMemo(() => groupByYear(activities), [activities])

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }))

  const openCreate = () => {
    setForm(emptyForm)
    setFormError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Name is required.'); return }
    setSubmitting(true)
    setFormError(null)
    try {
      const num = v => (v === '' || v === null || v === undefined ? null : Number(v))
      const payload = {
        id: 0,
        name: form.name,
        ddate: form.ddate ? new Date(form.ddate).toISOString() : null,
        duration: num(form.duration),
        distance: num(form.distance),
        elevationGain: num(form.elevationGain),
        elevationLoss: num(form.elevationLoss),
        avgSpeed: num(form.avgSpeed),
        maxSpeed: num(form.maxSpeed),
        movingTime: num(form.movingTime),
      }
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        let msg = `Error: ${res.status}`
        try { const b = await res.json(); msg = b?.title || b?.message || msg } catch {}
        throw new Error(msg)
      }
      setSuccess('Activity added successfully!')
      setShowModal(false)
      await fetchActivities()
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      setFormError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2>Bicycle</h2>
          <span className={styles.breadcrumb}>Home / Sport / MySport / Bicycle</span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.refreshBtn} onClick={fetchActivities} disabled={loading} title="Refresh">
            <RefreshCw size={16} className={loading ? styles.spin : ''} />
          </button>
          <button className={styles.addBtn} onClick={openCreate}>
            <PlusCircle size={16} /> Add Activity
          </button>
        </div>
      </div>

      {success && (
        <div className={styles.successMsg}>
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {loading ? (
        <div className={styles.stateBox}>
          <Loader2 size={32} className={styles.spin} />
          <span>Loading activities...</span>
        </div>
      ) : error ? (
        <div className={`${styles.stateBox} ${styles.stateError}`}>
          <AlertCircle size={32} />
          <span>{error}</span>
        </div>
      ) : activities.length === 0 ? (
        <div className={styles.stateBox}>
          <Bike size={40} />
          <span>No activities found</span>
        </div>
      ) : (
        <>
        <div className={styles.chartsRow}>
          <YearBarChart title="Distance by Year" unit=" km" data={yearlyData} field="distance" color="var(--accent)" />
          <YearBarChart title="Elevation Gain by Year" unit=" m" data={yearlyData} field="elevationGain" color="#2a78d6" />
        </div>
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <span className={styles.tableCount}>
              <strong>{sortedByDistance.length}</strong> days ({activities.length} activities)
            </span>
            <div className={styles.legend}>
              <span className={`${styles.legendDot} ${styles.dotCurrent}`} /> This year
              <span className={`${styles.legendDot} ${styles.dotRecent}`} /> Last 12 months
              <span className={`${styles.legendDot} ${styles.dotOlder}`} /> Older
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Distance (km)</th>
                  <th>Elevation Gain (m)</th>
                </tr>
              </thead>
              <tbody>
                {sortedByDistance.map((a, i) => {
                  const rank = i + 1
                  const rowClass = rank <= 3 ? styles.rankXl : rank <= 5 ? styles.rankLg : ''
                  const category = dateCategory(a.ddate)
                  const dateClass = category === 'current' ? styles.dateCurrent
                    : category === 'recent' ? styles.dateRecent
                    : category === 'older' ? styles.dateOlder
                    : ''
                  return (
                    <tr key={a.id ?? i} className={rowClass}>
                      <td className={styles.rankCell}>{rank}</td>
                      <td className={styles.nameCell}>{a.name ?? '—'}</td>
                      <td>
                        <span className={`${styles.dateBadge} ${dateClass}`}>{formatDate(a.ddate)}</span>
                      </td>
                      <td>{Math.round(a.distance * 10) / 10}</td>
                      <td>{Math.round(a.elevationGain)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {showModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>New Activity</h3>
              <button className={styles.closeBtn} onClick={closeModal}><X size={18} /></button>
            </div>
            {formError && (
              <div className={styles.formError}>
                <AlertCircle size={15} /> {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label>Name *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Morning Ride" />
                </div>
                <div className={styles.formGroup}>
                  <label>Date</label>
                  <input type="date" value={form.ddate} onChange={e => set('ddate', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Duration (min)</label>
                  <input type="number" step="any" value={form.duration} onChange={e => set('duration', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Distance (km)</label>
                  <input type="number" step="any" value={form.distance} onChange={e => set('distance', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Moving Time (min)</label>
                  <input type="number" step="any" value={form.movingTime} onChange={e => set('movingTime', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Elevation Gain (m)</label>
                  <input type="number" step="1" value={form.elevationGain} onChange={e => set('elevationGain', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Elevation Loss (m)</label>
                  <input type="number" step="1" value={form.elevationLoss} onChange={e => set('elevationLoss', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Avg Speed (km/h)</label>
                  <input type="number" step="any" value={form.avgSpeed} onChange={e => set('avgSpeed', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Max Speed (km/h)</label>
                  <input type="number" step="any" value={form.maxSpeed} onChange={e => set('maxSpeed', e.target.value)} />
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? <Loader2 size={15} className={styles.spin} /> : <PlusCircle size={15} />}
                  {submitting ? 'Saving...' : 'Add Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
