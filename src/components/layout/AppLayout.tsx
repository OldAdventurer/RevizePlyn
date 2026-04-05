import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import Header from './Header'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <Header onMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="pt-12 lg:pt-0 lg:pl-[240px] pb-16 md:pb-0">
        <div key={location.pathname} className="max-w-[960px] mx-auto px-4 py-6 md:px-6 lg:px-8 page-enter">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
