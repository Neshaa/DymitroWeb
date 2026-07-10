import { useState } from 'react'
import {
  LayoutDashboard, LogIn, UserPlus, ChevronRight, Banknote,
  Trophy, ChevronDown, Settings2, Bike, X
} from 'lucide-react'
import styles from './Sidebar.module.css'

const mainNav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'salary', label: 'Salary', icon: Banknote },
]

const sportNav = [
  {
    id: 'all-time-results',
    label: 'All Time Results',
    icon: Trophy,
    children: [
      { id: 'volleyball', label: 'Volleyball' },
      { id: 'waterpolo', label: 'Waterpolo' },
      { id: 'football', label: 'Football' },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: Settings2,
    children: [
      { id: 'football-players', label: 'Football Teams' },
    ],
  },
  {
    id: 'my-sport',
    label: 'MySport',
    icon: Bike,
    children: [
      { id: 'bicycle', label: 'Bicycle' },
    ],
  },
]

const accountNav = [
  { id: 'login', label: 'Log in', icon: LogIn },
  { id: 'signup', label: 'Sign up', icon: UserPlus },
]

export default function Sidebar({ activePage, setActivePage, isOpen, onClose }) {
  const [openMenus, setOpenMenus] = useState({ 'all-time-results': true })

  const toggleMenu = (id) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.logo}>
        <img src="/favicon.svg" alt="Dymitro" style={{ width: 28, height: 28 }} />
        <span>Dymitro</span>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      <nav className={styles.nav}>
        <p className={styles.navLabel}>Main</p>
        {mainNav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`${styles.navItem} ${activePage === id ? styles.active : ''}`}
            onClick={() => setActivePage(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
            {activePage === id && <ChevronRight size={14} className={styles.chevron} />}
          </button>
        ))}
      </nav>

      <nav className={styles.nav}>
        <p className={styles.navLabel}>Sport</p>
        {sportNav.map(({ id, label, icon: Icon, children }) => (
          <div key={id}>
            {children ? (
              <>
                <button
                  className={`${styles.navItem} ${styles.navItemParent} ${children.some(c => c.id === activePage) ? styles.active : ''}`}
                  onClick={() => toggleMenu(id)}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  <ChevronDown
                    size={14}
                    className={`${styles.chevronDown} ${openMenus[id] ? styles.chevronDownOpen : ''}`}
                  />
                </button>
                {openMenus[id] && (
                  <div className={styles.subMenu}>
                    {children.map(child => (
                      <button
                        key={child.id}
                        className={`${styles.subMenuItem} ${activePage === child.id ? styles.subMenuItemActive : ''}`}
                        onClick={() => setActivePage(child.id)}
                      >
                        <span className={styles.subMenuDot} />
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <button
                className={`${styles.navItem} ${activePage === id ? styles.active : ''}`}
                onClick={() => setActivePage(id)}
              >
                <Icon size={18} />
                <span>{label}</span>
                {activePage === id && <ChevronRight size={14} className={styles.chevron} />}
              </button>
            )}
          </div>
        ))}
      </nav>

      <nav className={styles.nav}>
        <p className={styles.navLabel}>Account</p>
        {accountNav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`${styles.navItem} ${activePage === id ? styles.active : ''}`}
            onClick={() => setActivePage(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.userProfile}>
        <div className={styles.avatar}>ST</div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>Shrina Tesla</span>
          <span className={styles.userHandle}>@imshrina</span>
        </div>
      </div>
      </aside>
    </>
  )
}
