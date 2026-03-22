import { NavLink } from 'react-router-dom'
import { Home, ClipboardList, Wrench, Users, FileText, Settings, X } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { to: '/', icon: Home, label: 'Nástěnka' },
  { to: '/zakazky', icon: ClipboardList, label: 'Zakázky' },
  { to: '/zarizeni', icon: Wrench, label: 'Zařízení' },
  { to: '/zakaznici', icon: Users, label: 'Zákazníci' },
  { to: '/revizni-zpravy', icon: FileText, label: 'Revizní zprávy' },
  { to: '/nastaveni', icon: Settings, label: 'Nastavení' },
]

function NavContent({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 mt-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onItemClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 min-h-[48px] text-lg font-medium rounded-lg transition-colors ${
              isActive
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text)] hover:bg-gray-100'
            }`
          }
        >
          <item.icon size={22} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-[280px] bg-white border-r border-[var(--color-border)] z-30 p-4">
        <div className="px-4 py-3 mb-2">
          <h1 className="text-xl font-bold text-[var(--color-primary)]">RevizePlyn</h1>
        </div>
        <NavContent />
      </aside>

      {/* Mobile / tablet overlay sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <aside className="fixed left-0 top-0 h-full w-[280px] bg-white z-50 p-4 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 mb-2">
              <h1 className="text-xl font-bold text-[var(--color-primary)]">RevizePlyn</h1>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                aria-label="Zavřít menu"
              >
                <X size={24} />
              </button>
            </div>
            <NavContent onItemClick={onClose} />
          </aside>
        </div>
      )}
    </>
  )
}
