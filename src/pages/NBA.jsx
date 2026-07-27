import { useState, useEffect, useRef } from 'react'
import { ArrowUp, ArrowDown, Loader2, AlertCircle, PlusCircle, X, CheckCircle } from 'lucide-react'
import styles from './NBA.module.css'

const BASE = 'https://dymitroapi.onrender.com/NBA'

const CURRENT_YEAR = 2026
const OLDEST_SEASON = 2015
const SEASONS = Array.from({ length: CURRENT_YEAR - OLDEST_SEASON + 1 }, (_, i) => CURRENT_YEAR - i)
const FILTER_SEASONS = [...SEASONS, 'Previous']

// { player: { id, firstName, lastName, country, active, balkan, fullName }, points, ptsPosition,
//   rebounds, rbnPosition, asists, astPosition, positionMove }
const CATEGORIES = [
  { key: 'points', statLabel: 'Points', endpoint: 'GetPoints', countryEndpoint: 'GetPointsByCountry', valueField: 'points', positionField: 'ptsPosition' },
  { key: 'rebounds', statLabel: 'Rebounds', endpoint: 'GetRebounds', countryEndpoint: 'GetReboundsByCountry', valueField: 'rebounds', positionField: 'rbnPosition' },
  { key: 'assists', statLabel: 'Assists', endpoint: 'GetAsists', countryEndpoint: 'GetAsistsByCountry', valueField: 'asists', positionField: 'astPosition' },
]

function normalizeRow(raw, category, byCountry) {
  return {
    id: raw.player?.id,
    player: byCountry ? raw.player?.country : (raw.player?.fullName || `${raw.player?.firstName ?? ''} ${raw.player?.lastName ?? ''}`.trim()),
    position: raw[category.positionField],
    value: raw[category.valueField],
    move: raw.positionMove,
    balkan: !!raw.player?.balkan,
    active: raw.player?.active,
  }
}

// In the mixed (non-Balkan-only) view, Balkan players stand out in blue.
// In Balkan-only mode every row is Balkan already, so blue would be meaningless — fall back to the active/inactive coloring.
function playerColorClass(row, balkanOnly) {
  if (!balkanOnly && row.balkan) return styles.balkanPlayer
  if (row.active === 0) return styles.inactivePlayer
  return styles.activePlayer
}

function LeadersTable({ category, season, balkan, byCountry, refreshKey }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const endpoint = byCountry ? category.countryEndpoint : category.endpoint
    fetch(`${BASE}/${endpoint}/${season}/${balkan}`)
      .then(res => { if (!res.ok) throw new Error(`Error: ${res.status}`); return res.json() })
      .then(data => {
        if (cancelled) return
        // API assigns positions 1/2 to a couple of entries with no recorded stat for this category — drop them.
        const filtered = Array.isArray(data) ? data.filter(r => r[category.valueField] != null) : []
        setRows(filtered.map(r => normalizeRow(r, category, byCountry)))
      })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [category, season, balkan, byCountry, refreshKey])

  return (
    <div className={styles.tableCard}>
      {loading ? (
        <div className={styles.tableState}>
          <Loader2 size={22} className={styles.spin} />
          <span>Loading...</span>
        </div>
      ) : error ? (
        <div className={`${styles.tableState} ${styles.tableStateError}`}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : rows.length === 0 ? (
        <div className={styles.tableState}>
          <span>No data for this season</span>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pos</th>
                <th className={styles.thMove}></th>
                <th>{byCountry ? 'Country' : 'Player'}</th>
                <th>{category.statLabel}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className={styles.indexCell}>{row.position ?? i + 1}</td>
                  <td className={styles.moveCell}>
                    {row.move ? (
                      row.move > 0
                        ? <span className={styles.moveBadgeUp}><ArrowUp size={11} />{row.move}</span>
                        : <span className={styles.moveBadgeDown}><ArrowDown size={11} />{Math.abs(row.move)}</span>
                    ) : null}
                  </td>
                  <td className={`${styles.playerCell} ${playerColorClass(row, balkan)}`}>
                    {row.player}
                  </td>
                  <td className={styles.statCell}>{typeof row.value === 'number' ? row.value.toLocaleString('en-US') : row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PlayerAutocomplete({ onSelect }) {
  const [query, setQuery] = useState('')
  const [players, setPlayers] = useState([])
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    fetch(BASE).then(r => r.json()).then(d => setPlayers(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const suggestions = query.trim()
    ? players.filter(p => `${p.firstName ?? ''} ${p.lastName ?? ''}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  const handlePick = (p) => {
    setQuery(`${p.firstName ?? ''} ${p.lastName ?? ''}`.trim())
    setOpen(false)
    onSelect(p)
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); onSelect(null) }}
        onFocus={() => query.trim() && setOpen(true)}
        placeholder="Type player name..."
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 2000,
          background: 'white', border: '1.5px solid #c8d8e8', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', margin: '4px 0 0', padding: 0,
          listStyle: 'none', maxHeight: 220, overflowY: 'auto'
        }}>
          {suggestions.map(p => (
            <li
              key={p.id}
              onMouseDown={() => handlePick(p)}
              style={{
                padding: '9px 14px', cursor: 'pointer', fontSize: 13,
                borderBottom: '1px solid #f0f0f0', fontFamily: 'Poppins, sans-serif',
                color: '#1a1a2e'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(65,140,62,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              {p.firstName} {p.lastName} <span style={{ color: '#9aa5b4' }}>({p.country})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const emptyResultForm = { points: '', rebounds: '', assists: '' }

function AddResultModal({ onClose, onSaved }) {
  const [player, setPlayer] = useState(null)
  const [season, setSeason] = useState(CURRENT_YEAR)
  const [form, setForm] = useState(emptyResultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!player) { setError('Please select a player.'); return }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        playerId: player.id,
        season: String(season),
        points: form.points !== '' ? Number(form.points) : null,
        rebounds: form.rebounds !== '' ? Number(form.rebounds) : null,
        asists: form.assists !== '' ? Number(form.assists) : null,
      }
      const res = await fetch(`${BASE}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        let msg = `Error: ${res.status}`
        try { const b = await res.json(); msg = b?.title || b?.message || msg } catch {}
        throw new Error(msg)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Add Daily Result</h3>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        {error && (
          <div className={styles.formError}>
            <AlertCircle size={14} /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
              <label>Player *</label>
              <PlayerAutocomplete onSelect={setPlayer} />
            </div>
            <div className={styles.formGroup}>
              <label>Season</label>
              <select
                className={styles.select}
                value={season}
                onChange={e => setSeason(e.target.value === 'Previous' ? 'Previous' : Number(e.target.value))}
              >
                {FILTER_SEASONS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className={styles.formGroup} />
            <div className={styles.formGroup}>
              <label>Points</label>
              <input
                type="number"
                value={form.points}
                onChange={e => setForm(p => ({ ...p, points: e.target.value }))}
                placeholder="e.g. 24"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Rebounds</label>
              <input
                type="number"
                value={form.rebounds}
                onChange={e => setForm(p => ({ ...p, rebounds: e.target.value }))}
                placeholder="e.g. 8"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Assists</label>
              <input
                type="number"
                value={form.assists}
                onChange={e => setForm(p => ({ ...p, assists: e.target.value }))}
                placeholder="e.g. 6"
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? <Loader2 size={15} className={styles.spin} /> : <PlusCircle size={15} />}
              {saving ? 'Saving...' : 'Add Result'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function NBA() {
  const [season, setSeason] = useState(CURRENT_YEAR)
  const [balkanOnly, setBalkanOnly] = useState(false)
  const [byCountry, setByCountry] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [success, setSuccess] = useState(null)

  const handleResultSaved = () => {
    setRefreshKey(k => k + 1)
    setSuccess('Result added successfully!')
    setTimeout(() => setSuccess(null), 3000)
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2>NBA Results</h2>
        </div>
      </div>

      {success && (
        <div className={styles.successMsg}>
          <CheckCircle size={16} /> {success}
        </div>
      )}

      <div className={styles.controlsBar}>
        <div className={styles.controlGroup}>
          <label>Season</label>
          <select
            className={styles.select}
            value={season}
            onChange={e => setSeason(e.target.value === 'Previous' ? 'Previous' : Number(e.target.value))}
          >
            {FILTER_SEASONS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button
          type="button"
          className={styles.switchGroup}
          onClick={() => setBalkanOnly(v => !v)}
          role="switch"
          aria-checked={balkanOnly}
        >
          <span>Balkan only</span>
          <span className={`${styles.switchTrack} ${balkanOnly ? styles.switchTrackOn : ''}`}>
            <span className={styles.switchThumb} />
          </span>
        </button>
        <button
          type="button"
          className={styles.switchGroup}
          onClick={() => setByCountry(v => !v)}
          role="switch"
          aria-checked={byCountry}
        >
          <span>By country</span>
          <span className={`${styles.switchTrack} ${byCountry ? styles.switchTrackOn : ''}`}>
            <span className={styles.switchThumb} />
          </span>
        </button>
        <button type="button" className={styles.addResultBtn} onClick={() => setShowAddModal(true)}>
          <PlusCircle size={15} /> Add Result
        </button>
      </div>

      <div className={styles.tablesRow}>
        {CATEGORIES.map(category => (
          <LeadersTable key={category.key} category={category} season={season} balkan={balkanOnly} byCountry={byCountry} refreshKey={refreshKey} />
        ))}
      </div>

      {showAddModal && (
        <AddResultModal onClose={() => setShowAddModal(false)} onSaved={handleResultSaved} />
      )}
    </div>
  )
}
