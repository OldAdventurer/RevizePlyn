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
      <main className="pt-16 lg:pt-0 lg:pl-[280px] pb-20 md:pb-0">
        <div key={location.pathname} className="max-w-[1200px] mx-auto p-4 md:p-6 lg:p-8 page-enter">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
