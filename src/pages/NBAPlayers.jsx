import { useState, useEffect, useMemo } from 'react'
import { Loader2, AlertCircle, RefreshCw, Search, Users, PlusCircle, Pencil, X, CheckCircle } from 'lucide-react'
import styles from './NBAPlayers.module.css'

const API_URL = 'https://dymitroapi.onrender.com/NBA'

const defaultFilters = { name: '', country: '', balkan: 'yes', active: 'yes' }
const emptyForm = { firstName: '', lastName: '', country: '', balkan: false, active: true }

export default function NBAPlayers() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(defaultFilters)
  const [applied, setApplied] = useState(defaultFilters)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editPlayer, setEditPlayer] = useState(null) // null = CREATE, object = EDIT
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [success, setSuccess] = useState(null)

  const fetchPlayers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(API_URL)
      if (!res.ok) throw new Error(`Error: ${res.status}`)
      const data = await res.json()
      setPlayers(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlayers() }, [])

  // GET /NBA has no query params — filter client-side
  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const fullName = `${p.firstName ?? ''} ${p.lastName ?? ''}`.toLowerCase()
      if (applied.name && !fullName.includes(applied.name.toLowerCase())) return false
      if (applied.country && !(p.country ?? '').toLowerCase().includes(applied.country.toLowerCase())) return false
      if (applied.balkan === 'yes' && !p.balkan) return false
      if (applied.balkan === 'no' && p.balkan) return false
      if (applied.active === 'yes' && p.active === 0) return false
      if (applied.active === 'no' && p.active !== 0) return false
      return true
    })
  }, [players, applied])

  const handleSearch = (e) => {
    e.preventDefault()
    setApplied(filters)
  }

  const handleReset = () => {
    setFilters(defaultFilters)
    setApplied(defaultFilters)
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
      firstName: player.firstName || '',
      lastName: player.lastName || '',
      country: player.country || '',
      balkan: !!player.balkan,
      active: player.active !== 0,
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
    if (!form.firstName.trim() || !form.lastName.trim()) { setFormError('First name and last name are required.'); return }
    setSubmitting(true)
    setFormError(null)
    try {
      const payload = {
        id: editPlayer?.id ?? 0,
        firstName: form.firstName,
        lastName: form.lastName,
        country: form.country || null,
        active: form.active ? 1 : 0,
        balkan: form.balkan ? 1 : 0,
      }
      const res = await fetch(API_URL, {
        method: editPlayer ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        let msg = `Error: ${res.status}`
        try { const b = await res.json(); msg = b?.title || b?.message || msg } catch {}
        throw new Error(msg)
      }
      setSuccess(editPlayer ? 'Player updated successfully!' : 'Player added successfully!')
      setShowModal(false)
      await fetchPlayers()
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
          <h2>NBA Players</h2>
          <span className={styles.breadcrumb}>Home / Administration / NBA Players</span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.refreshBtn} onClick={fetchPlayers} disabled={loading} title="Osveži">
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
            <input value={filters.country} onChange={e => setFilters(p => ({ ...p, country: e.target.value }))} placeholder="e.g. USA" />
          </div>
          <div className={styles.filterGroup}>
            <label>Balkan</label>
            <select value={filters.balkan} onChange={e => setFilters(p => ({ ...p, balkan: e.target.value }))} className={styles.select}>
              <option value="all">All</option>
              <option value="yes">Balkan only</option>
              <option value="no">Non-Balkan</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Status</label>
            <select value={filters.active} onChange={e => setFilters(p => ({ ...p, active: e.target.value }))} className={styles.select}>
              <option value="all">All</option>
              <option value="yes">Active only</option>
              <option value="no">Inactive only</option>
            </select>
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
      ) : filteredPlayers.length === 0 ? (
        <div className={styles.stateBox}>
          <Users size={40} />
          <span>No players found</span>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <span className={styles.tableCount}>
              <strong>{filteredPlayers.length}</strong> players
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
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Country</th>
                  <th>Balkan</th>
                  <th className={styles.thActions}></th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player, i) => {
                  const isInactive = player.active === 0
                  return (
                    <tr key={player.id ?? i} className={isInactive ? styles.rowInactive : styles.rowActive}>
                      <td><span className={styles.nameCell}>{player.firstName || '—'}</span></td>
                      <td><span className={styles.nameCell}>{player.lastName || '—'}</span></td>
                      <td><span className={styles.countryCell}>{player.country || '—'}</span></td>
                      <td>{player.balkan ? <span className={styles.badge}>Balkan</span> : '—'}</td>
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
                  <label>First Name *</label>
                  <input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} placeholder="e.g. Nikola" />
                </div>
                <div className={styles.formGroup}>
                  <label>Last Name *</label>
                  <input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} placeholder="e.g. Jokić" />
                </div>
                <div className={styles.formGroup}>
                  <label>Country</label>
                  <input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} placeholder="e.g. Serbia" />
                </div>
                <div className={styles.formGroup}>
                  <label>Status</label>
                  <select value={form.active ? '1' : '0'} onChange={e => setForm(p => ({ ...p, active: e.target.value === '1' }))} className={styles.select}>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={form.balkan}
                      onChange={e => setForm(p => ({ ...p, balkan: e.target.checked }))}
                    />
                    Former Yugoslavia player
                  </label>
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
