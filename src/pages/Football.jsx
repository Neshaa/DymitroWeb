import { useState, useEffect, useRef } from 'react'
import { Loader2, AlertCircle, Trophy, Users, Star, ArrowUp, ArrowDown, PlusCircle, X, CheckCircle } from 'lucide-react'
import styles from './Football.module.css'

const BASE = 'https://dymitroapi.onrender.com/Football/Football'

const WORLD_CUP_YEARS = Array.from(
  { length: Math.floor((2026 - 1950) / 4) + 1 },
  (_, i) => 2026 - i * 4
)

const TABS = [
  { id: 'worldcups', label: 'World Cups', icon: Trophy },
  { id: 'players', label: 'Players', icon: Users },
  { id: 'cl-scorers', label: 'Champions League Scorers', icon: Star },
]

function flattenRow(row) {
  const result = {}
  for (const [key, val] of Object.entries(row)) {
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      // Use .name or .Name if available, otherwise stringify
      if (val.name !== undefined) result[key] = val.name
      else if (val.Name !== undefined) result[key] = val.Name
      else result[key] = JSON.stringify(val)
    } else {
      result[key] = val
    }
  }
  return result
}

function DataTable({ data, loading, error, emptyText, hideCols = [], renameCols = {}, orderCols = [] }) {
  if (loading) return (
    <div className={styles.tableState}>
      <Loader2 size={24} className={styles.spin} />
      <span>Loading...</span>
    </div>
  )
  if (error) return (
    <div className={`${styles.tableState} ${styles.tableStateError}`}>
      <AlertCircle size={22} />
      <span>{error}</span>
    </div>
  )
  if (!data || data.length === 0) return (
    <div className={styles.tableState}>
      <span>{emptyText || 'No data'}</span>
    </div>
  )

  const flat = data.map(row => {
    const f = flattenRow(row)
    // Extract country from team object if present
    if (row.team && typeof row.team === 'object') {
      if (row.team.country !== undefined) f.country = row.team.country
      else if (row.team.Country !== undefined) f.country = row.team.Country
    }
    return f
  })
  const hideLower = [...hideCols, 'position', 'positionmove'].map(c => c.toLowerCase())
  const allCols = Object.keys(flat[0]).filter(c => !hideLower.includes(c.toLowerCase()))

  // Reorder columns if orderCols provided
  const orderLower = [...new Set(orderCols.map(c => c.toLowerCase()))]
  const columns = orderCols.length
    ? [
        ...orderLower.filter(o => allCols.some(c => c.toLowerCase() === o)).map(o => allCols.find(c => c.toLowerCase() === o)),
        ...allCols.filter(c => !orderLower.includes(c.toLowerCase()))
      ]
    : allCols

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th className={styles.thMove}></th>
            {columns.map(col => <th key={col}>{renameCols[col] ?? renameCols[col.toLowerCase()] ?? col}</th>)}
          </tr>
        </thead>
        <tbody>
          {flat.map((row, i) => {
            const move = row.positionMove ?? row.PositionMove ?? row.positionmove ?? null
            const moveNum = move !== null ? Number(move) : null
            return (
              <tr key={i}>
                <td className={styles.indexCell}>{row.position ?? row.Position ?? i + 1}</td>
                <td className={styles.moveCell}>
                  {moveNum !== null && moveNum !== 0 && (
                    moveNum > 0
                      ? <span className={styles.moveBadgeUp}><ArrowUp size={11} />{moveNum}</span>
                      : <span className={styles.moveBadgeDown}><ArrowDown size={11} />{Math.abs(moveNum)}</span>
                  )}
                </td>
              {columns.map(col => (
                <td key={col}>{row[col] != null && row[col] !== '' ? String(row[col]) : '—'}</td>
              ))}
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const emptyInsertForm = { teamId: '', teamName: '', no: '', year: 2026 }

function TeamAutocomplete({ value, onSelect }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleInput = (e) => {
    const q = e.target.value
    setQuery(q)
    onSelect(null) // clear selection when typing
    clearTimeout(debounceRef.current)
    if (!q.trim()) { setSuggestions([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`https://dymitroapi.onrender.com/Football/suggestions?search=${encodeURIComponent(q)}`)
        const data = await res.json()
        setSuggestions(Array.isArray(data) ? data : [])
        setOpen(true)
      } catch { setSuggestions([]) }
      finally { setLoading(false) }
    }, 300)
  }

  const handlePick = (item) => {
    const name = item.teamFormated ?? item.name ?? item.Name ?? String(item.id ?? item.Id ?? '')
    setQuery(name)
    setSuggestions([])
    setOpen(false)
    onSelect(item)
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={handleInput}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder="Type team name..."
        autoComplete="off"
      />
      {loading && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /></span>}
      {open && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 2000,
          background: 'white', border: '1.5px solid #c8d8e8', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', margin: '4px 0 0', padding: 0,
          listStyle: 'none', maxHeight: 220, overflowY: 'auto'
        }}>
          {suggestions.map((item, i) => (
            <li
              key={i}
              onMouseDown={() => handlePick(item)}
              style={{
                padding: '9px 14px', cursor: 'pointer', fontSize: 13,
                borderBottom: '1px solid #f0f0f0', fontFamily: 'Poppins, sans-serif',
                color: '#1a1a2e'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(65,140,62,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              {item.teamFormated ?? item.name ?? item.Name ?? JSON.stringify(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function WorldCupsTab() {
  const [year, setYear] = useState(2026)
  const [statsData, setStatsData] = useState([])
  const [countryData, setCountryData] = useState([])
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingCountry, setLoadingCountry] = useState(false)
  const [errorStats, setErrorStats] = useState(null)
  const [errorCountry, setErrorCountry] = useState(null)
  const [showInsert, setShowInsert] = useState(false)
  const [insertForm, setInsertForm] = useState({ ...emptyInsertForm, year })
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [inserting, setInserting] = useState(false)
  const [insertError, setInsertError] = useState(null)
  const [insertSuccess, setInsertSuccess] = useState(false)

  const fetchAll = async (y) => {
    setLoadingStats(true)
    setLoadingCountry(true)
    setErrorStats(null)
    setErrorCountry(null)

    fetch(`${BASE}/GetWorldCupStatistics/${y}`)
      .then(r => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json() })
      .then(d => setStatsData(Array.isArray(d) ? d : []))
      .catch(e => setErrorStats(e.message))
      .finally(() => setLoadingStats(false))

    fetch(`${BASE}/GetWorldCupStatisticsByCountry/${y}`)
      .then(r => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json() })
      .then(d => setCountryData(Array.isArray(d) ? d : []))
      .catch(e => setErrorCountry(e.message))
      .finally(() => setLoadingCountry(false))
  }

  useEffect(() => { fetchAll(year) }, [year])

  const openInsert = () => {
    setInsertForm({ ...emptyInsertForm, year })
    setSelectedTeam(null)
    setInsertError(null)
    setInsertSuccess(false)
    setShowInsert(true)
  }

  const handleInsert = async (e) => {
    e.preventDefault()
    setInserting(true)
    setInsertError(null)
    try {
      if (!selectedTeam) throw new Error('Please select a team from suggestions.')
      const payload = {
        team: { id: selectedTeam.id ?? selectedTeam.Id ?? null },
        id: 0,
        no: insertForm.no !== '' ? Number(insertForm.no) : null,
        year: Number(insertForm.year),
      }
      const res = await fetch(`${BASE}/InsertWorldCupPlayer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        let msg = `Error ${res.status}`
        try { const b = await res.json(); if (b?.title) msg = b.title; else if (b?.message) msg = b.message } catch {}
        throw new Error(msg)
      }
      setInsertSuccess(true)
      setInsertForm({ ...emptyInsertForm, year })
      fetchAll(year)
      setTimeout(() => { setInsertSuccess(false); setShowInsert(false) }, 2000)
    } catch (err) {
      setInsertError(err.message)
    } finally {
      setInserting(false)
    }
  }

  return (
    <div className={styles.wcTab}>
      <div className={styles.tablesRow}>
        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <Trophy size={15} />
            <span>Teams</span>
            <button className={styles.insertBtn} onClick={openInsert}>
              <PlusCircle size={14} /> Add
            </button>
          </div>
          <DataTable
            data={statsData}
            loading={loadingStats}
            error={errorStats}
            emptyText="No statistics for this year"
            hideCols={['year']}
            renameCols={{ noofplayers: 'No Players', noOfPlayers: 'No Players', numberOfPlayers: 'No Players' }}
            orderCols={['team', 'country', 'noOfPlayers']}
          />
        </div>

        <div className={styles.yearDivider}>
          <select
            className={styles.yearSelect}
            value={year}
            onChange={e => setYear(Number(e.target.value))}
          >
            {WORLD_CUP_YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <span>🌍</span>
            <span>Country</span>
          </div>
          <DataTable
            data={countryData}
            loading={loadingCountry}
            error={errorCountry}
            emptyText="No country data for this year"
            hideCols={['year', 'team']}
            orderCols={['country', 'noOfPlayers']}
            renameCols={{ noofplayers: 'No Players', noOfPlayers: 'No Players' }}
          />
        </div>
      </div>

      {/* Insert Modal */}
      {showInsert && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Add World Cup Entry</h3>
              <button className={styles.closeBtn} onClick={() => setShowInsert(false)}><X size={18} /></button>
            </div>
            {insertError && (
              <div className={styles.formError}>
                <AlertCircle size={14} /> {insertError}
              </div>
            )}
            {insertSuccess && (
              <div className={styles.formSuccess}>
                <CheckCircle size={14} /> Saved successfully!
              </div>
            )}
            <form onSubmit={handleInsert} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Team</label>
                  <TeamAutocomplete
                    value={insertForm.teamName}
                    onSelect={item => {
                      setSelectedTeam(item)
                      if (item) setInsertForm(p => ({ ...p, teamName: item.name ?? item.Name ?? '' }))
                    }}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>No</label>
                  <input
                    type="number"
                    value={insertForm.no}
                    onChange={e => setInsertForm(p => ({ ...p, no: e.target.value }))}
                    placeholder="e.g. 23"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Year</label>
                  <select
                    className={styles.yearSelect}
                    value={insertForm.year}
                    onChange={e => setInsertForm(p => ({ ...p, year: Number(e.target.value) }))}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    {WORLD_CUP_YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowInsert(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={inserting}>
                  {inserting ? <Loader2 size={15} className={styles.spin} /> : <PlusCircle size={15} />}
                  {inserting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function PlaceholderTab({ label }) {
  return (
    <div className={styles.placeholder}>
      <span className={styles.placeholderIcon}>🚧</span>
      <span className={styles.placeholderText}>{label} — coming soon</span>
    </div>
  )
}

export default function Football() {
  const [activeTab, setActiveTab] = useState('worldcups')

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2>Football</h2>
          <span className={styles.breadcrumb}>Home / Sport / Football</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`${styles.tab} ${activeTab === id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={styles.tabContent}>
        {activeTab === 'worldcups' && <WorldCupsTab />}
        {activeTab === 'players' && <PlaceholderTab label="Players" />}
        {activeTab === 'cl-scorers' && <PlaceholderTab label="Champions League Scorers" />}
      </div>
    </div>
  )
}
