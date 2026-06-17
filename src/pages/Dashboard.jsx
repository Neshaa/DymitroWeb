import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, ShoppingCart, DollarSign,
  CreditCard, AlertCircle, Package, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import styles from './Dashboard.module.css'

const salesData = [
  { month: 'Jan', sales: 4000, purchase: 2400 },
  { month: 'Feb', sales: 3000, purchase: 1398 },
  { month: 'Mar', sales: 6000, purchase: 3800 },
  { month: 'Apr', sales: 8000, purchase: 3908 },
  { month: 'May', sales: 5000, purchase: 4800 },
  { month: 'Jun', sales: 9000, purchase: 3800 },
  { month: 'Jul', sales: 7000, purchase: 4300 },
  { month: 'Aug', sales: 11000, purchase: 6000 },
  { month: 'Sep', sales: 9500, purchase: 5400 },
  { month: 'Oct', sales: 13000, purchase: 7200 },
  { month: 'Nov', sales: 11500, purchase: 6100 },
  { month: 'Dec', sales: 15000, purchase: 8500 },
]

const pieData = [
  { name: 'First Time', value: 5500 },
  { name: 'Return', value: 3500 },
]

const topProducts = [
  { name: 'Wireless Earphones', price: '$149.99', sold: 1240, pct: 28, trend: 'up' },
  { name: 'Gaming Joy Stick', price: '$89.99', sold: 980, pct: 22, trend: 'up' },
  { name: 'Smart Watch Pro', price: '$299.99', sold: 760, pct: 17, trend: 'down' },
  { name: 'USB-C Fast Charger', price: '$39.99', sold: 620, pct: 14, trend: 'up' },
  { name: 'Bluetooth Speaker', price: '$79.99', sold: 540, pct: 12, trend: 'down' },
]

const lowStock = [
  { name: 'Wireless Mouse', stock: 5, total: 100 },
  { name: 'HDMI Cable 2m', stock: 8, total: 200 },
  { name: 'USB Hub 7-Port', stock: 3, total: 80 },
  { name: 'Laptop Stand', stock: 12, total: 150 },
]

const recentSales = [
  { id: '#1045', product: 'Wireless Earphones', category: 'Electronics', price: '$149.99', status: 'Completed', date: 'Jun 1' },
  { id: '#1044', product: 'Gaming Joy Stick', category: 'Gaming', price: '$89.99', status: 'Processing', date: 'Jun 1' },
  { id: '#1043', product: 'Smart Watch Pro', category: 'Wearables', price: '$299.99', status: 'Pending', date: 'May 31' },
  { id: '#1042', product: 'USB-C Charger', category: 'Accessories', price: '$39.99', status: 'Completed', date: 'May 31' },
  { id: '#1041', product: 'Bluetooth Speaker', category: 'Audio', price: '$79.99', status: 'Cancelled', date: 'May 30' },
]

const kpiCards = [
  { label: 'Total Sales', value: '$25,000', change: '+12.5%', up: true, icon: ShoppingCart, color: '#418C3E' },
  { label: 'Total Purchase', value: '$18,000', change: '+8.2%', up: true, icon: DollarSign, color: '#4a9eff' },
  { label: 'Total Expenses', value: '$9,000', change: '-3.1%', up: false, icon: CreditCard, color: '#e05c5c' },
  { label: 'Invoice Due', value: '$25,000', change: '+5.7%', up: true, icon: AlertCircle, color: '#f5a623' },
]

const PIE_COLORS = ['#418C3E', '#4a9eff']

export default function Dashboard() {
  const [chartPeriod, setChartPeriod] = useState('Year')

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageTitle}>
        <h2>Dashboard</h2>
        <span className={styles.breadcrumb}>Home / Dashboard</span>
      </div>

      <div className={styles.kpiGrid}>
        {kpiCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className={styles.kpiCard}>
              <div className={styles.kpiIcon} style={{ background: card.color + '22', color: card.color }}>
                <Icon size={22} />
              </div>
              <div className={styles.kpiInfo}>
                <span className={styles.kpiLabel}>{card.label}</span>
                <span className={styles.kpiValue}>{card.value}</span>
              </div>
              <div className={`${styles.kpiChange} ${card.up ? styles.up : styles.down}`}>
                {card.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {card.change}
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.card} style={{ flex: 2 }}>
          <div className={styles.cardHeader}>
            <h3>Sales vs Purchase</h3>
            <div className={styles.periodTabs}>
              {['Year', 'Month', 'Week'].map(p => (
                <button
                  key={p}
                  className={`${styles.tab} ${chartPeriod === p ? styles.tabActive : ''}`}
                  onClick={() => setChartPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#418C3E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#418C3E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="purchase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4a9eff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4a9eff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fill: '#9aa5b4', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9aa5b4', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1a1a2e', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="sales" stroke="#418C3E" strokeWidth={2} fill="url(#sales)" name="Sales" />
              <Area type="monotone" dataKey="purchase" stroke="#4a9eff" strokeWidth={2} fill="url(#purchase)" name="Purchase" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.card} style={{ flex: 1 }}>
          <div className={styles.cardHeader}>
            <h3>Customers Overview</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={PIE_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1a1a2e', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend wrapperStyle={{ color: '#4a5568', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className={styles.pieStats}>
            <div className={styles.pieStat}>
              <span className={styles.pieStatDot} style={{ background: '#418C3E' }} />
              <div>
                <div className={styles.pieStatValue}>5.5K</div>
                <div className={styles.pieStatLabel}>First Time (25%)</div>
              </div>
            </div>
            <div className={styles.pieStat}>
              <span className={styles.pieStatDot} style={{ background: '#4a9eff' }} />
              <div>
                <div className={styles.pieStatValue}>3.5K</div>
                <div className={styles.pieStatLabel}>Return (21%)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tablesRow}>
        <div className={styles.card} style={{ flex: 1.4 }}>
          <div className={styles.cardHeader}>
            <h3>Top Selling Products</h3>
            <a href="#" className={styles.viewAll}>View All</a>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Sold</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={i}>
                  <td>
                    <div className={styles.productCell}>
                      <div className={styles.productIcon}><Package size={14} /></div>
                      {p.name}
                    </div>
                  </td>
                  <td>{p.price}</td>
                  <td>{p.sold.toLocaleString()}</td>
                  <td>
                    <span className={`${styles.pct} ${p.trend === 'up' ? styles.up : styles.down}`}>
                      {p.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {p.pct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.card} style={{ flex: 1 }}>
          <div className={styles.cardHeader}>
            <h3>Low Stock Products</h3>
            <a href="#" className={styles.viewAll}>View All</a>
          </div>
          <div className={styles.stockList}>
            {lowStock.map((item, i) => (
              <div key={i} className={styles.stockItem}>
                <div className={styles.stockName}>{item.name}</div>
                <div className={styles.stockBar}>
                  <div
                    className={styles.stockFill}
                    style={{
                      width: `${(item.stock / item.total) * 100}%`,
                      background: item.stock < 10 ? '#e05c5c' : '#f5a623'
                    }}
                  />
                </div>
                <span className={styles.stockCount}>{item.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3>Recent Sales</h3>
          <a href="#" className={styles.viewAll}>View All</a>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentSales.map((sale, i) => (
              <tr key={i}>
                <td><span className={styles.orderId}>{sale.id}</span></td>
                <td>{sale.product}</td>
                <td><span className={styles.category}>{sale.category}</span></td>
                <td>{sale.price}</td>
                <td style={{ color: 'var(--text-muted)' }}>{sale.date}</td>
                <td>
                  <span className={`${styles.status} ${
                    sale.status === 'Completed' ? styles.statusCompleted :
                    sale.status === 'Processing' ? styles.statusProcessing :
                    sale.status === 'Pending' ? styles.statusPending :
                    styles.statusCancelled
                  }`}>{sale.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
