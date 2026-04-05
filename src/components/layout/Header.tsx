import { Menu } from 'lucide-react'
import { Link } from 'react-router-dom'

interface HeaderProps {
  onMenuToggle: () => void
}

export default function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-12 bg-white border-b border-[var(--color-border)] z-30 lg:hidden flex items-center justify-between px-4">
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <span className="w-6 h-6 bg-[var(--color-primary)] rounded-md flex items-center justify-center text-white text-xs font-bold">R</span>
        <span className="text-sm font-semibold text-[var(--color-text)]">RevizePlyn</span>
      </Link>
      <button
        onClick={onMenuToggle}
        className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors cursor-pointer"
        aria-label="Otevřít menu"
      >
        <Menu size={20} />
      </button>
    </header>
  )
}
