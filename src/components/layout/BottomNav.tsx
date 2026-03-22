import { NavLink } from 'react-router-dom'
import { Home, ClipboardList, FileText, Settings } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: 'Domů' },
  { to: '/zakazky', icon: ClipboardList, label: 'Zakázky' },
  { to: '/revizni-zpravy', icon: FileText, label: 'Revize' },
  { to: '/nastaveni', icon: Settings, label: 'Více' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-border)] z-30 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center min-h-[56px] gap-0.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-gray-500 hover:text-[var(--color-text)]'
              }`
            }
          >
            <tab.icon size={22} />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
