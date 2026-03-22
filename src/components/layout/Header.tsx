import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'

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
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-[var(--color-border)] z-30 lg:hidden flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-[var(--color-primary)]">RevizePlyn</span>
        <span className="text-gray-400 hidden sm:inline">|</span>
        <span className="text-base text-[var(--color-text)] hidden sm:inline">{currentTitle}</span>
      </div>
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
        aria-label="Otevřít menu"
      >
        <Menu size={24} />
      </button>
    </header>
  )
}
