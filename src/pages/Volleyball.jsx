import { useState, useEffect } from 'react'
import { Trophy, Users, Star, Medal, Loader2, AlertCircle, PlusCircle, X, CheckCircle } from 'lucide-react'
import styles from './Volleyball.module.css'

const BASE = 'https://dymitroapi.onrender.com'

const TABS = [
  { id: 'world-championships', label: 'World Championships', icon: Trophy },
  { id: 'olympics', label: 'Olympics', icon: Medal },
  { id: 'european-championship', label: 'European Championship', icon: Star },
  { id: 'medals', label: 'Medals', icon: Users },
]

const COMPETITION_CONFIGS = {
  'world-championships': {
    men: 'WorldChampionship',
    women: 'WorldChampionshipWomen',
    resultsLabel: 'World Championships',
  },
  'olympics': {
    men: 'Olympics',
    women: 'OlympicsWomen',
    resultsLabel: 'Olympics',
  },
  'european-championship': {
    men: 'EuropeanChampionship',
    women: 'EuropeanChampionshipWomen',
    resultsLabel: 'European Championship',
  },
}

function TableState({ loading, error, empty }) {
  if (loading) return (
    <div className={styles.tableState}>
      <Loader2 size={22} className={styles.spin} />
      <span>Loading...</span>
    </div>
  )
  if (error) return (
    <div className={`${styles.tableState} ${styles.tableStateError}`}>
      <AlertCircle size={20} />
      <span>{error}</span>
    </div>
  )
  if (empty) return (
    <div className={styles.tableState}>
      <span>No data</span>
    </div>
  )
  return null
}

function MedalTable({ data, loading, error }) {
  if (loading || error || !data || data.length === 0)
    return <TableState loading={loading} error={error} empty={!loading && !error && (!data || data.length === 0)} />

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Country</th>
            <th className={styles.medalCol}><span className={styles.goldDot} />Gold</th>
            <th className={styles.medalCol}><span className={styles.silverDot} />Silver</th>
            <th className={styles.medalCol}><span className={styles.bronzeDot} />Bronze</th>
            <th className={styles.medalCol}>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const nameObj = row.name
            const country = (typeof nameObj === 'object' && nameObj !== null)
              ? (nameObj.country ?? nameObj.Country ?? '—').toString().trim()
              : (nameObj ?? '—').toString().trim()
            const isHistorical = (typeof nameObj === 'object' && nameObj !== null)
              ? nameObj.active === 0
              : false
            return (
              <tr key={i} className={isHistorical ? styles.historicalRow : ''}>
                <td className={styles.indexCell}>{i + 1}</td>
                <td className={styles.countryCell}>{country}</td>
                <td className={styles.medalCell}>{row.firstCount || ''}</td>
                <td className={styles.medalCell}>{row.secondCount || ''}</td>
                <td className={styles.medalCell}>{row.thirdCount || ''}</td>
                <td className={styles.medalCell}>{row.total || ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ResultsTable({ data, loading, error }) {
  if (loading || error || !data || data.length === 0)
    return <TableState loading={loading} error={error} empty={!loading && !error && (!data || data.length === 0)} />

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Year</th>
            <th>1st</th>
            <th>2nd</th>
            <th>3rd</th>
            <th>Host</th>
          </tr>
        </thead>
        <tbody>
          {[...data].sort((a, b) => (b.year ?? 0) - (a.year ?? 0)).map((row, i) => {
            const extractCountry = v =>
              (v && typeof v === 'object') ? (v.country ?? v.Country ?? '—').toString().trim() : (v ?? '—')
            const first = extractCountry(row.first)
            const second = extractCountry(row.second)
            const third = extractCountry(row.third)
            const host = (row.host ?? '—').toString().trim()
            const firstIsHistorical = row.first?.active === 0
            const secondIsHistorical = row.second?.active === 0
            const thirdIsHistorical = row.third?.active === 0
            return (
              <tr key={i}>
                <td className={styles.yearCell}>{row.year ?? '—'}</td>
                <td className={`${styles.firstCell} ${firstIsHistorical ? styles.historicalCell : ''}`}>{first}</td>
                <td className={secondIsHistorical ? styles.historicalCell : ''}>{second}</td>
                <td className={thirdIsHistorical ? styles.historicalCell : ''}>{third}</td>
                <td className={styles.hostCell}>{host}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const emptyForm = { year: 2024, host: '', first: '', second: '', third: '' }

function CreateModal({ competition, onClose, onSaved }) {
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        sport: 'Volleyball',
        year: Number(form.year),
        host: form.host,
        first: { country: form.first, active: 1, balkan: 0 },
        second: { country: form.second, active: 1, balkan: 0 },
        third: { country: form.third, active: 1, balkan: 0 },
        competition,
      }
      const res = await fetch(`${BASE}/SportCompetition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        let msg = `Error ${res.status}`
        try { const b = await res.json(); if (b?.title) msg = b.title; else if (b?.message) msg = b.message } catch {}
        throw new Error(msg)
      }
      setSuccess(true)
      setTimeout(() => { onSaved(); onClose() }, 700)
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
          <h3>Add World Championship</h3>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        {error && (
          <div className={styles.formError}>
            <AlertCircle size={14} /> {error}
          </div>
        )}
        {success && (
          <div className={styles.formSuccess}>
            <CheckCircle size={14} /> Saved successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Year</label>
              <input
                type="number"
                value={form.year}
                onChange={e => set('year', e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Host</label>
              <input
                type="text"
                value={form.host}
                onChange={e => set('host', e.target.value)}
                placeholder="e.g. Japan"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>1st Place</label>
              <input
                type="text"
                value={form.first}
                onChange={e => set('first', e.target.value)}
                placeholder="e.g. Brazil"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>2nd Place</label>
              <input
                type="text"
                value={form.second}
                onChange={e => set('second', e.target.value)}
                placeholder="e.g. Italy"
                required
              />
            </div>
            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
              <label>3rd Place</label>
              <input
                type="text"
                value={form.third}
                onChange={e => set('third', e.target.value)}
                placeholder="e.g. Serbia"
                required
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? <Loader2 size={15} className={styles.spin} /> : <PlusCircle size={15} />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CompetitionTab({ tabId }) {
  const config = COMPETITION_CONFIGS[tabId]
  const [competition, setCompetition] = useState(config.men)
  const [medals, setMedals] = useState([])
  const [results, setResults] = useState([])
  const [loadingMedals, setLoadingMedals] = useState(false)
  const [loadingResults, setLoadingResults] = useState(false)
  const [errorMedals, setErrorMedals] = useState(null)
  const [errorResults, setErrorResults] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAll = (silent = false) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoadingMedals(true)
      setLoadingResults(true)
    }
    setErrorMedals(null)
    setErrorResults(null)

    let done = 0
    const finish = () => { if (++done === 2) setRefreshing(false) }

    fetch(`${BASE}/SportCompetition/stats?sport=volleyball&competition=${competition}`)
      .then(r => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json() })
      .then(d => setMedals(Array.isArray(d) ? d : []))
      .catch(e => setErrorMedals(e.message))
      .finally(() => { if (!silent) setLoadingMedals(false); finish() })

    fetch(`${BASE}/SportCompetition?sport=volleyball&competition=${competition}`)
      .then(r => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json() })
      .then(d => setResults(Array.isArray(d) ? d : []))
      .catch(e => setErrorResults(e.message))
      .finally(() => { if (!silent) setLoadingResults(false); finish() })
  }

  useEffect(() => { fetchAll(false) }, [competition])

  return (
    <div className={styles.wcTab}>
      <div className={styles.wcTopBar}>
        <div className={styles.competitionToggle}>
          {[{ id: config.men, label: 'Men' }, { id: config.women, label: 'Women' }].map(c => (
            <button
              key={c.id}
              className={`${styles.toggleBtn} ${competition === c.id ? styles.toggleBtnActive : ''}`}
              onClick={() => setCompetition(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <button className={styles.addBtn} onClick={() => setShowCreate(true)}>
          <PlusCircle size={15} /> Add
        </button>
      </div>

      <div className={styles.tablesRow}>
        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <Medal size={15} />
            <span>Medal Table</span>
            {refreshing && <Loader2 size={14} className={`${styles.spin} ${styles.refreshSpinner}`} />}
          </div>
          <MedalTable data={medals} loading={loadingMedals} error={errorMedals} />
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <Trophy size={15} />
            <span>{config.resultsLabel}</span>
            {refreshing && <Loader2 size={14} className={`${styles.spin} ${styles.refreshSpinner}`} />}
          </div>
          <ResultsTable data={results} loading={loadingResults} error={errorResults} />
        </div>
      </div>

      {showCreate && (
        <CreateModal
          competition={competition}
          onClose={() => setShowCreate(false)}
          onSaved={() => fetchAll(true)}
        />
      )}
    </div>
  )
}

function PlaceholderTab({ label }) {
  return (
    <div className={styles.placeholder}>
      <span className={styles.placeholderIcon}>🏐</span>
      <span className={styles.placeholderText}>{label} — coming soon</span>
    </div>
  )
}

export default function Volleyball() {
  const [activeTab, setActiveTab] = useState('world-championships')

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2>Volleyball</h2>
          <span className={styles.breadcrumb}>Home / Sport / All Time Results / Volleyball</span>
        </div>
      </div>

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

      <div className={styles.tabContent}>
        {activeTab === 'world-championships' && <CompetitionTab tabId="world-championships" />}
        {activeTab === 'olympics' && <CompetitionTab tabId="olympics" />}
        {activeTab === 'european-championship' && <CompetitionTab tabId="european-championship" />}
        {activeTab === 'medals' && <PlaceholderTab label="Medals" />}
      </div>
    </div>
  )
}
