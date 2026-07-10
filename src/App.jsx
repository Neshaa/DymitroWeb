import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Salary from './pages/Salary'
import FootballPlayers from './pages/FootballPlayers'
import Football from './pages/Football'
import Volleyball from './pages/Volleyball'
import Bicycle from './pages/Bicycle'
import './App.css'

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSetActivePage = (page) => {
    setActivePage(page)
    setSidebarOpen(false)
  }

  const renderPage = () => {
    switch (activePage) {
      case 'salary': return <Salary />
      case 'football-players': return <FootballPlayers />
      case 'football': return <Football />
      case 'volleyball': return <Volleyball />
      case 'bicycle': return <Bicycle />
      default: return <Dashboard />
    }
  }

  return (
    <div className="app-layout">
      <Sidebar
        activePage={activePage}
        setActivePage={handleSetActivePage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main-area">
        <header className="mobile-topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <span className="mobile-logo">Dymitro</span>
        </header>
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default App
