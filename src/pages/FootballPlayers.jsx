import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, RefreshCw, Search, Users, PlusCircle, Pencil, X, CheckCircle } from 'lucide-react'
import styles from './FootballPlayers.module.css'

const API_URL = 'https://dymitroapi.onrender.com/Football'
const HIDDEN = ['active', 'id']

const emptyForm = { name: '', country: '', continent: '', active: 1 }

export default function FootballPlayers() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ name: '', country: '', continent: '' })
  const [applied, setApplied] = useState({ name: '', country: '', continent: '' })

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editPlayer, setEditPlayer] = useState(null) // null = CREATE, object = EDIT
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [success, setSuccess] = useState(null)

  const fetchPlayers = async (f = applied) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (f.name) params.append('name', f.name)
      if (f.country) params.append('country', f.country)
      if (f.continent) params.append('continent', f.continent)
      const url = params.toString() ? `${API_URL}?${params}` : API_URL
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Error: ${res.status}`)
      const data = await res.json()
      setPlayers(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlayers({ name: '', country: '', continent: '' }) }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setApplied(filters)
    fetchPlayers(filters)
  }

  const handleReset = () => {
    const empty = { name: '', country: '', continent: '' }
    setFilters(empty)
    setApplied(empty)
    fetchPlayers(empty)
  }

  const openCreate = () => {
    setEditPlayer(null)
    setForm(emptyForm)
    setFormError(null)
    setShowModal(true)
  }

  const openEdit = (player) => {
    setEditPlayer(player)
    setForm({
      name: player.name || '',
      country: player.country || '',
      continent: player.continent || '',
      active: player.active ?? 1,
    })
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
      const payload = {
        id: editPlayer?.id ?? 0,
        name: form.name || null,
        country: form.country || null,
        continent: form.continent || null,
        active: parseInt(form.active) ?? 1,
      }
      let res
      if (editPlayer) {
        res = await fetch(`${API_URL}/${editPlayer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      if (!res.ok) {
        let msg = `Error: ${res.status}`
        try { const b = await res.json(); msg = b?.title || b?.message || msg } catch {}
        throw new Error(msg)
      }
      setSuccess(editPlayer ? 'Player updated successfully!' : 'Player added successfully!')
      setShowModal(false)
      await fetchPlayers(applied)
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      setFormError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = players.length > 0
    ? Object.keys(players[0]).filter(c => !HIDDEN.includes(c.toLowerCase()))
    : []

  const nameCol = columns.find(c => c.toLowerCase().includes('name')) || columns[0]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2>Football Teams</h2>
          <span className={styles.breadcrumb}>Home / Administration / Football Teams</span>

        </div>
        <div className={styles.headerActions}>
          <button className={styles.refreshBtn} onClick={() => fetchPlayers()} disabled={loading} title="Osveži">
            <RefreshCw size={16} className={loading ? styles.spin : ''} />
          </button>
          <button className={styles.addBtn} onClick={openCreate}>
            <PlusCircle size={16} /> Add Player
          </button>
        </div>
      </div>

      {success && (
        <div className={styles.successMsg}>
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {/* Filteri */}
      <form className={styles.filterCard} onSubmit={handleSearch}>
        <div className={styles.filterGrid}>
          <div className={styles.filterGroup}>
            <label>Name</label>
            <div className={styles.inputIcon}>
              <Search size={14} className={styles.inputIconIcon} />
              <input value={filters.name} onChange={e => setFilters(p => ({ ...p, name: e.target.value }))} placeholder="Search by name..." />
            </div>
          </div>
          <div className={styles.filterGroup}>
            <label>Country</label>
            <input value={filters.country} onChange={e => setFilters(p => ({ ...p, country: e.target.value }))} placeholder="e.g. Serbia" />
          </div>
          <div className={styles.filterGroup}>
            <label>Continent</label>
            <input value={filters.continent} onChange={e => setFilters(p => ({ ...p, continent: e.target.value }))} placeholder="e.g. Europe" />
          </div>
          <div className={styles.filterActions}>
            <button type="submit" className={styles.searchBtn}><Search size={14} /> Search</button>
            <button type="button" className={styles.resetBtn} onClick={handleReset}>Reset</button>
          </div>
        </div>
      </form>

      {/* Content */}
      {loading ? (
        <div className={styles.stateBox}>
          <Loader2 size={32} className={styles.spin} />
          <span>Loading players...</span>
        </div>
      ) : error ? (
        <div className={`${styles.stateBox} ${styles.stateError}`}>
          <AlertCircle size={32} />
          <span>{error}</span>
        </div>
      ) : players.length === 0 ? (
        <div className={styles.stateBox}>
          <Users size={40} />
          <span>No players found</span>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <span className={styles.tableCount}>
              <strong>{players.length}</strong> players
            </span>
            <div className={styles.legend}>
              <span className={styles.legendDot} style={{ background: 'var(--success)' }} /> Active
              <span className={styles.legendDot} style={{ background: 'var(--border)', marginLeft: 12 }} /> Inactive
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {columns.map(col => <th key={col}>{col}</th>)}
                  <th className={styles.thActions}></th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, i) => {
                  const isInactive = player.active === 0 || player.active === false || player.active === '0'
                  return (
                    <tr key={i} className={isInactive ? styles.rowInactive : styles.rowActive}>
                      {columns.map(col => (
                        <td key={col}>
                          {col.toLowerCase().includes('continent') ? (
                            <span className={styles.badge}>{player[col] ?? '—'}</span>
                          ) : col.toLowerCase().includes('country') ? (
                            <span className={styles.countryCell}>{player[col] ?? '—'}</span>
                          ) : col === nameCol ? (
                            <span className={styles.nameCell}>{player[col] ?? '—'}</span>
                          ) : (
                            player[col] != null && player[col] !== '' ? String(player[col]) : '—'
                          )}
                        </td>
                      ))}
                      <td className={styles.tdActions}>
                        <button className={styles.editBtn} onClick={() => openEdit(player)} title="Izmeni">
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editPlayer ? 'Edit Player' : 'New Player'}</h3>
              <button className={styles.closeBtn} onClick={closeModal}><X size={18} /></button>
            </div>
            {formError && (
              <div className={styles.formError}>
                <AlertCircle size={15} /> {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Name *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Player name" />
                </div>
                <div className={styles.formGroup}>
                  <label>Country</label>
                  <input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} placeholder="e.g. Serbia" />
                </div>
                <div className={styles.formGroup}>
                  <label>Continent</label>
                  <input value={form.continent} onChange={e => setForm(p => ({ ...p, continent: e.target.value }))} placeholder="e.g. Europe" />
                </div>
                <div className={styles.formGroup}>
                  <label>Status</label>
                  <select value={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.value }))} className={styles.select}>
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? <Loader2 size={15} className={styles.spin} /> : (editPlayer ? <Pencil size={15} /> : <PlusCircle size={15} />)}
                  {submitting ? 'Saving...' : (editPlayer ? 'Save Changes' : 'Add Player')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
