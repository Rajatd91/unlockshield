import React from 'react'
import DashboardApp from './DashboardApp'
import StartupSite from './startup/StartupSite'
import './startup/startup.css'

function App() {
  const path = window.location.pathname
  if (path === '/app' || path.startsWith('/app/')) {
    return <DashboardApp />
  }
  return <StartupSite />
}

export default App
