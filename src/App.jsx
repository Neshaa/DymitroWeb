import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Salary from './pages/Salary'
import FootballPlayers from './pages/FootballPlayers'
import Football from './pages/Football'
import Volleyball from './pages/Volleyball'
import './App.css'

function App() {
  const [activePage, setActivePage] = useState('dashboard')

  const renderPage = () => {
    switch (activePage) {
      case 'salary': return <Salary />
      case 'football-players': return <FootballPlayers />
      case 'football': return <Football />
      case 'volleyball': return <Volleyball />
      default: return <Dashboard />
    }
  }

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="main-area">
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default App
