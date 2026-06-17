import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, Trophy, Users, Star, ArrowUp, ArrowDown } from 'lucide-react'
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

function WorldCupsTab() {
  const [year, setYear] = useState(2026)
  const [statsData, setStatsData] = useState([])
  const [countryData, setCountryData] = useState([])
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingCountry, setLoadingCountry] = useState(false)
  const [errorStats, setErrorStats] = useState(null)
  const [errorCountry, setErrorCountry] = useState(null)

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

  return (
    <div className={styles.wcTab}>
      <div className={styles.tablesRow}>
        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <Trophy size={15} />
            <span>Teams</span>
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
