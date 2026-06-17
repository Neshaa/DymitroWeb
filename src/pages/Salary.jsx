import { useState, useEffect } from 'react'
import { PlusCircle, Loader2, AlertCircle, X, CheckCircle, Banknote, Euro, ChevronLeft, ChevronRight, Building2, RefreshCw } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import megaLogo from '../assets/mega.png'
import bancaIntesaLogo from '../assets/banca-intesa-1.jpg'
import intelisaleLogo from '../assets/intelisale.png'
import styles from './Salary.module.css'

const API_URL = 'https://dymitroapi.onrender.com/Salary'
const PAGE_SIZE = 15

const formatThousands = (val) => {
  if (val === '' || val === null || val === undefined) return ''
  const str = String(val)
  const parts = str.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

const stripFormat = (val) => String(val).replace(/,/g, '')

const emptyForm = {
  company: '',
  date: '',
  taxes: '',
  net: '',
  gross: '',
  course: '',
  netInEuro: '',
}

const COMPANY_LOGOS = {
  'Mega': megaLogo,
  'Banca Intesa': bancaIntesaLogo,
  'Intelisale': intelisaleLogo,
}

function CompanyCell({ name }) {
  const logo = COMPANY_LOGOS[name]
  return (
    <div className={styles.companyCell}>
      {logo
        ? <img src={logo} alt={name} className={styles.companyLogo} />
        : <div className={styles.companyIcon}><Building2 size={13} /></div>
      }
      <span>{name || '—'}</span>
    </div>
  )
}

export default function Salary() {
  const [salaries, setSalaries] = useState([])
  const [totals, setTotals] = useState({ totalRSDNet: null, totalEurNet: null })
  const [statsByYear, setStatsByYear] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [page, setPage] = useState(1)

  const fetchSalaries = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(API_URL)
      if (!res.ok) throw new Error(`Greška: ${res.status}`)
      const data = await res.json()
      const obj = Array.isArray(data) ? data[0] : data
      setSalaries(obj?.salariesviewmodels ?? [])
      setStatsByYear(obj?.statsByYear ?? [])
      setTotals({
        totalRSDNet: obj?.totalRSDNet ?? null,
        totalEurNet: obj?.totalEurNet ?? null,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSalaries()
  }, [])

  const handleChange = (e) => {
    const { name } = e.target
    const raw = stripFormat(e.target.value)

    setForm(prev => {
      const updated = { ...prev, [name]: raw }

      const brutoRaw = stripFormat(name === 'gross' ? raw : updated.gross)
      const brutoVal = parseFloat(brutoRaw) || 0
      const hasBruto = brutoRaw !== '' && brutoRaw !== '0'
      const porezi = parseFloat(stripFormat(name === 'taxes' ? raw : updated.taxes)) || 0
      const kurs = parseFloat(stripFormat(name === 'course' ? raw : updated.course)) || 0

      if ((name === 'gross' || name === 'taxes') && hasBruto) {
        const neto = Math.max(0, brutoVal - porezi)
        updated.net = neto.toFixed(2)
        if (kurs > 0) updated.netInEuro = (neto / kurs).toFixed(2)
      }

      if (name === 'gross' && !hasBruto) {
        updated.net = ''
        updated.netInEuro = ''
      }

      if (name === 'course') {
        const neto = parseFloat(stripFormat(updated.net)) || 0
        updated.netInEuro = kurs > 0 ? (neto / kurs).toFixed(2) : ''
      }

      if (name === 'net') {
        const neto = parseFloat(raw) || 0
        updated.netInEuro = kurs > 0 ? (neto / kurs).toFixed(2) : ''
      }

      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!form.company) {
      setError('Molimo izaberite kompaniju.')
      setSubmitting(false)
      return
    }
    if (!form.net && !form.gross) {
      setError('Unesite Bruto ili Neto vrednost.')
      setSubmitting(false)
      return
    }

    try {
      const payload = {
        company: form.company || null,
        date: form.date ? form.date.toISOString() : null,
        taxes: form.taxes !== '' ? parseFloat(stripFormat(form.taxes)) : null,
        net: form.net !== '' ? parseFloat(stripFormat(form.net)) : null,
        gross: form.gross !== '' ? parseFloat(stripFormat(form.gross)) : null,
        course: form.course !== '' ? parseFloat(stripFormat(form.course)) : null,
        netInEuro: form.netInEuro !== '' ? parseFloat(stripFormat(form.netInEuro)) : null,
        monthYear: null,
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        let errMsg = `Server greška (${res.status})`
        try {
          const errBody = await res.json()
          if (errBody?.title) errMsg = errBody.title
          else if (errBody?.message) errMsg = errBody.message
          else if (typeof errBody === 'string') errMsg = errBody
        } catch { /* nije JSON */ }
        throw new Error(errMsg)
      }

      setSuccess(true)
      setForm(emptyForm)
      setShowForm(false)
      setPage(1)
      await fetchSalaries()
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      if (e instanceof TypeError && e.message === 'Failed to fetch') {
        setError('Nije moguće povezati se sa serverom. Proverite internet konekciju.')
      } else {
        setError(e.message || 'Došlo je do neočekivane greške.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const fmt = (val) => (val != null ? val.toLocaleString('de-DE', { minimumFractionDigits: 2 }) : '—')

  // Pie chart - suma neto po kompaniji
  const pieData = Object.entries(
    salaries.reduce((acc, s) => {
      const key = s.company || 'Ostalo'
      acc[key] = (acc[key] || 0) + (s.netInEuro || 0)
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))

  const PIE_COLORS = ['#418C3E', '#4a9eff', '#f5a623', '#e05c5c', '#a855f7']

  // Paging
  const totalPages = Math.max(1, Math.ceil(salaries.length / PAGE_SIZE))
  const paginated = salaries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2>Salary</h2>
          <span className={styles.breadcrumb}>Home / Salary</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className={styles.refreshBtn} onClick={fetchSalaries} disabled={loading} title="Osveži podatke">
            <RefreshCw size={16} className={loading ? styles.spin : ''} />
          </button>
          <button className={styles.addBtn} onClick={() => setShowForm(true)}>
            <PlusCircle size={16} />
            Dodaj platu
          </button>
        </div>
      </div>

      {/* Summary kartice */}
      <div className={styles.summaryGrid3}>
        <div className={`${styles.summaryCard} ${styles.summaryRsd}`}>
          <div className={styles.summaryLeft}>
            <span className={styles.summaryLabel}>Ukupno Neto (RSD)</span>
            <span className={styles.summaryValue}>
              {totals.totalRSDNet != null
                ? totals.totalRSDNet.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' RSD'
                : '—'}
            </span>
            <span className={styles.summarySubtitle}>Zbir svih neto plata</span>
          </div>
          <div className={`${styles.summaryIcon} ${styles.summaryIconRsd}`}>
            <Banknote size={24} />
          </div>
        </div>

        <div className={`${styles.summaryCard} ${styles.summaryEur}`}>
          <div className={styles.summaryLeft}>
            <span className={styles.summaryLabel}>Ukupno Neto (EUR)</span>
            <span className={styles.summaryValue}>
              {totals.totalEurNet != null
                ? totals.totalEurNet.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' €'
                : '—'}
            </span>
            <span className={styles.summarySubtitle}>Zbir svih neto plata u eurima</span>
          </div>
          <div className={`${styles.summaryIcon} ${styles.summaryIconEur}`}>
            <Euro size={24} />
          </div>
        </div>

        {/* Pie chart - po kompaniji */}
        <div className={`${styles.summaryCard} ${styles.pieCard}`}>
          <div className={styles.pieCardLeft}>
            <span className={styles.summaryLabel}>Neto po kompaniji (EUR)</span>
            <div className={styles.pieLegend}>
              {pieData.map((entry, i) => (
                <div key={entry.name} className={styles.pieLegendItem}>
                  <span className={styles.pieDot} style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className={styles.pieLegendName}>{entry.name}</span>
                  <span className={styles.pieLegendVal}>{entry.value.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={32} outerRadius={55} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', fontFamily: 'Poppins' }}
                formatter={(val) => [val.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' €', '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {success && (
        <div className={styles.successMsg}>
          <CheckCircle size={16} />
          Plata uspešno dodata!
        </div>
      )}

      {/* Modal forma */}
      {showForm && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Nova plata</h3>
              <button className={styles.closeBtn} onClick={() => { setShowForm(false); setError(null) }}>
                <X size={18} />
              </button>
            </div>
            {error && (
              <div className={styles.errorMsgInline}>
                <AlertCircle size={15} />
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Kompanija</label>
                  <select name="company" value={form.company} onChange={handleChange} className={styles.select}>
                    <option value="">-- Izaberi kompaniju --</option>
                    <option value="Intelisale">Intelisale</option>
                    <option value="Banca Intesa">Banca Intesa</option>
                    <option value="Mega">Mega</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Datum</label>
                  <DatePicker
                    selected={form.date}
                    onChange={(date) => setForm(prev => ({ ...prev, date }))}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="dd/mm/yyyy"
                    className={styles.datepicker}
                    wrapperClassName={styles.datepickerWrapper}
                    popperPlacement="bottom-start"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Bruto</label>
                  <input name="gross" value={formatThousands(form.gross)} onChange={handleChange} placeholder="0.00" />
                </div>
                <div className={styles.formGroup}>
                  <label>
                    Neto {form.gross ? <span className={styles.autoLabel}>auto</span> : null}
                  </label>
                  <input
                    name="net"
                    value={formatThousands(form.net)}
                    onChange={handleChange}
                    readOnly={!!form.gross}
                    placeholder="0.00"
                    className={form.gross ? styles.autoInput : ''}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Porezi</label>
                  <input name="taxes" value={formatThousands(form.taxes)} onChange={handleChange} placeholder="0.00" />
                </div>
                <div className={styles.formGroup}>
                  <label>Kurs (EUR)</label>
                  <input name="course" value={formatThousands(form.course)} onChange={handleChange} placeholder="0.0000" />
                </div>
                <div className={styles.formGroup}>
                  <label>Neto u EUR <span className={styles.autoLabel}>auto</span></label>
                  <input name="netInEuro" value={formatThousands(form.netInEuro)} readOnly placeholder="0.00" className={styles.autoInput} />
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>
                  Otkaži
                </button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? <Loader2 size={16} className={styles.spin} /> : <PlusCircle size={16} />}
                  {submitting ? 'Čuvanje...' : 'Sačuvaj'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className={styles.card}>
        {loading ? (
          <div className={styles.loadingState}>
            <Loader2 size={28} className={styles.spin} />
            <span>Učitavanje...</span>
          </div>
        ) : salaries.length === 0 ? (
          <div className={styles.emptyState}>
            <AlertCircle size={32} />
            <span>Nema podataka o platama</span>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Kompanija</th>
                    <th>Mesec/Godina</th>
                    <th style={{ textAlign: 'right' }}>Bruto</th>
                    <th style={{ textAlign: 'right' }}>Neto</th>
                    <th style={{ textAlign: 'right' }}>Porezi</th>
                    <th style={{ textAlign: 'right' }}>Kurs</th>
                    <th style={{ textAlign: 'right' }}>Neto (EUR)</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s, i) => (
                    <tr key={i}>
                      <td><CompanyCell name={s.company} /></td>
                      <td>{s.monthYear || '—'}</td>
                      <td className={styles.numCell}>{fmt(s.gross)}</td>
                      <td className={styles.numCell}>{fmt(s.net)}</td>
                      <td className={styles.numCell}>{fmt(s.taxes)}</td>
                      <td className={styles.numCell}>{s.course != null ? s.course.toFixed(4) : '—'}</td>
                      <td className={`${styles.numCell} ${styles.euroCell}`}>{fmt(s.netInEuro)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paging */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <span className={styles.pageInfo}>
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, salaries.length)} od {salaries.length}
                </span>
                <div className={styles.pageButtons}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className={styles.pageBtn}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bar chart po godinama */}
      {statsByYear.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Neto po godinama (EUR)</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statsByYear} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fill: '#9aa5b4', fontSize: 12, fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9aa5b4', fontSize: 12, fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontFamily: 'Poppins', fontSize: '13px' }}
                formatter={(val) => [val.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €', 'Ukupno']}
              />
              <Bar dataKey="totalSalary" fill="#418C3E" radius={[6, 6, 0, 0]} name="Ukupno EUR" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
