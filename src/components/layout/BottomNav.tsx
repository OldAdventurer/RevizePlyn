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
    <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-white/90 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] z-30 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center min-h-[56px] gap-1 text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-gray-400 hover:text-[var(--color-text)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`transition-all duration-200 ${isActive ? 'bg-[var(--color-primary)] text-white rounded-full p-1.5' : 'p-1.5'}`}>
                  <tab.icon size={20} />
                </span>
                <span>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
