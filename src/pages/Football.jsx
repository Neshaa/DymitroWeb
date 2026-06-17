import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, Trophy, Users, Star } from 'lucide-react'
import styles from './Football.module.css'

const BASE = 'https://dymitroapi.onrender.com/Football/Football'

const WORLD_CUP_YEARS = [
  2022, 2018, 2014, 2010, 2006, 2002, 1998, 1994, 1990, 1986, 1982, 1978, 1974, 1970, 1966, 1962, 1958, 1954, 1950
]

const TABS = [
  { id: 'worldcups', label: 'World Cups', icon: Trophy },
  { id: 'players', label: 'Players', icon: Users },
  { id: 'cl-scorers', label: 'Champions League Scorers', icon: Star },
]

function DataTable({ data, loading, error, emptyText }) {
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

  const columns = Object.keys(data[0])

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            {columns.map(col => <th key={col}>{col}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td className={styles.indexCell}>{i + 1}</td>
              {columns.map(col => (
                <td key={col}>{row[col] != null && row[col] !== '' ? String(row[col]) : '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function WorldCupsTab() {
  const [year, setYear] = useState(2022)
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
      <div className={styles.wcControls}>
        <div className={styles.yearControl}>
          <label>Year</label>
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
      </div>

      <div className={styles.tablesRow}>
        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <Trophy size={15} />
            <span>World Cup Statistics {year}</span>
          </div>
          <DataTable
            data={statsData}
            loading={loadingStats}
            error={errorStats}
            emptyText="No statistics for this year"
          />
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <span>🌍</span>
            <span>By Country {year}</span>
          </div>
          <DataTable
            data={countryData}
            loading={loadingCountry}
            error={errorCountry}
            emptyText="No country data for this year"
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
