import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Salary from './pages/Salary'
import FootballPlayers from './pages/FootballPlayers'
import Football from './pages/Football'
import './App.css'

function App() {
  const [activePage, setActivePage] = useState('dashboard')

  const renderPage = () => {
    switch (activePage) {
      case 'salary': return <Salary />
      case 'football-players': return <FootballPlayers />
      case 'football': return <Football />
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
