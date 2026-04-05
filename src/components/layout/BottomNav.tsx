import { NavLink } from 'react-router-dom'
import { Home, ClipboardList, Wrench, FileText, Banknote } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', icon: Home, label: 'Domů' },
  { to: '/zakazky', icon: ClipboardList, label: 'Zakázky' },
  { to: '/revizni-zpravy', icon: FileText, label: 'Revize' },
  { to: '/finance', icon: Banknote, label: 'Finance' },
  { to: '/zarizeni', icon: Wrench, label: 'Zařízení' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-30 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center h-14 gap-0.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                <span>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
