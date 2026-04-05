import { NavLink, Link } from 'react-router-dom'
import { Home, ClipboardList, Wrench, Users, FileText, Banknote, Settings, Clock, CalendarRange, X } from 'lucide-react'

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
  { to: '/lhutnik', icon: Clock, label: 'Lhůtník' },
  { to: '/harmonogramy', icon: CalendarRange, label: 'Harmonogramy' },
  { to: '/finance', icon: Banknote, label: 'Finance' },
  { to: '/nastaveni', icon: Settings, label: 'Nastavení' },
]

function NavContent({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5 mt-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onItemClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 h-9 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text-secondary)] hover:bg-neutral-100 hover:text-[var(--color-text)]'
            }`
          }
        >
          <item.icon size={18} className="shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function SidebarContent({ onClose, showClose = false, onItemClick }: { onClose?: () => void; showClose?: boolean; onItemClick?: () => void }) {
  return (
    <>
      <div className={`flex items-center ${showClose ? 'justify-between' : ''} px-3 py-3 mb-1`}>
        <Link to="/" className="text-base font-semibold text-[var(--color-text)] flex items-center gap-2 hover:opacity-80 transition-opacity" onClick={onClose}>
          <span className="w-7 h-7 bg-[var(--color-primary)] rounded-lg flex items-center justify-center text-white text-xs font-bold">R</span>
          <span>RevizePlyn</span>
        </Link>
        {showClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-neutral-100 text-[var(--color-text-secondary)] transition-colors cursor-pointer"
            aria-label="Zavřít menu"
          >
            <X size={18} />
          </button>
        )}
      </div>
      <div className="flex-1 px-2">
        <NavContent onItemClick={onItemClick} />
      </div>
      <div className="px-3 py-3 mt-auto">
        <span className="text-xs text-[var(--color-text-tertiary)]">Demo verze</span>
      </div>
    </>
  )
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-[240px] bg-white border-r border-[var(--color-border)] z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={onClose} />
          <aside className="fixed left-0 top-0 h-full w-[260px] bg-white border-r border-[var(--color-border)] z-50 flex flex-col animate-[slideIn_0.2s_ease-out]">
            <SidebarContent onClose={onClose} showClose onItemClick={onClose} />
          </aside>
        </div>
      )}
    </>
  )
}
