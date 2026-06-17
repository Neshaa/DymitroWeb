import styles from './Header.module.css'

const navLinks = ['Home', 'Inbox', 'Chat', 'Activity', 'Settings']

export default function Header() {
  return (
    <header className={styles.header}>
      <nav className={styles.topNav}>
        {navLinks.map(link => (
          <a key={link} href="#" className={styles.navLink}>{link}</a>
        ))}
      </nav>
    </header>
  )
}
