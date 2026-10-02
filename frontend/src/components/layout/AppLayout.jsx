import { Outlet } from 'react-router-dom'
import AppNavbar from './AppNavbar.jsx'

export default function AppLayout() {
  return (
    <div className="app-shell">
      <AppNavbar />
      <main>
        <Outlet />
      </main>
      <footer className="border-top bg-white py-4 text-center text-secondary">
        TOEIC Path Team Codebase
      </footer>
    </div>
  )
}

