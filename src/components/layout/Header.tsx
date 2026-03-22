import { Menu } from 'lucide-react'
import { useLocation, Link } from 'react-router-dom'

interface HeaderProps {
  onMenuToggle: () => void
}

const pageTitles: Record<string, string> = {
  '/': 'Nástěnka',
  '/zakazky': 'Zakázky',
  '/zarizeni': 'Zařízení',
  '/zakaznici': 'Zákazníci',
  '/revizni-zpravy': 'Revizní zprávy',
  '/nastaveni': 'Nastavení',
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation()
  const currentTitle = pageTitles[location.pathname] ?? 'RevizePlyn'

  return (
    <header className="fixed top-0 left-0 right-0 h-16 backdrop-blur-xl bg-white/80 border-b border-[var(--color-border)]/50 z-30 lg:hidden flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Link to="/" className="text-lg font-bold text-[var(--color-primary)] hover:opacity-80 transition-opacity">RevizePlyn</Link>
        <span className="text-slate-300 hidden sm:inline">/</span>
        <span className="text-sm text-[var(--color-text-secondary)] hidden sm:inline">{currentTitle}</span>
      </div>
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
        aria-label="Otevřít menu"
      >
        <Menu size={24} />
      </button>
    </header>
  )
}
