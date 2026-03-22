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
            `flex items-center gap-3 px-4 min-h-[48px] text-lg font-medium rounded-lg transition-all duration-200 relative ${
              isActive
                ? 'bg-white/10 text-white before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-white before:rounded-full'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <item.icon size={22} className="shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function SidebarContent({ onClose, showClose = false, onItemClick }: { onClose?: () => void; showClose?: boolean; onItemClick?: () => void }) {
  return (
    <>
      <div className={`flex items-center ${showClose ? 'justify-between' : ''} px-4 py-3 mb-1`}>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>🔥</span>
          <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">RevizePlyn</span>
        </h1>
        {showClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Zavřít menu"
          >
            <X size={24} />
          </button>
        )}
      </div>
      <div className="border-t border-white/10 mx-4 mb-2" />
      <div className="flex-1">
        <NavContent onItemClick={onItemClick} />
      </div>
      <div className="px-4 py-3 mt-auto">
        <span className="text-xs text-slate-500">Demo verze</span>
      </div>
    </>
  )
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-[280px] bg-gradient-to-b from-slate-900 to-slate-800 z-30 p-4">
        <SidebarContent />
      </aside>

      {/* Mobile / tablet overlay sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <aside className="fixed left-0 top-0 h-full w-[280px] bg-gradient-to-b from-slate-900 to-slate-800 z-50 p-4 shadow-xl flex flex-col animate-[slideIn_0.25s_ease-out]">
            <SidebarContent onClose={onClose} showClose onItemClick={onClose} />
          </aside>
        </div>
      )}
    </>
  )
}
