import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Home,
  ClipboardList,
  Wrench,
  Users,
  FileText,
  Banknote,
  Settings,
  Clock,
  CalendarRange,
} from 'lucide-react'

const pages = [
  { label: 'Nástěnka', to: '/', icon: Home },
  { label: 'Zakázky', to: '/zakazky', icon: ClipboardList },
  { label: 'Nová zakázka', to: '/zakazky/nova', icon: ClipboardList },
  { label: 'Zařízení', to: '/zarizeni', icon: Wrench },
  { label: 'Zákazníci', to: '/zakaznici', icon: Users },
  { label: 'Revizní zprávy', to: '/revizni-zpravy', icon: FileText },
  { label: 'Lhůtník', to: '/lhutnik', icon: Clock },
  { label: 'Harmonogramy', to: '/harmonogramy', icon: CalendarRange },
  { label: 'Finance', to: '/finance', icon: Banknote },
  { label: 'Nastavení', to: '/nastaveni', icon: Settings },
]

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const customers = useLiveQuery(() => db.customers.toArray()) ?? []
  const orders = useLiveQuery(() => db.orders.toArray()) ?? []

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  const go = useCallback((to: string) => {
    navigate(to)
    onOpenChange(false)
    setSearch('')
  }, [navigate, onOpenChange])

  const filteredCustomers = useMemo(() => {
    if (!search) return customers.slice(0, 5)
    const q = search.toLowerCase()
    return customers.filter(c => c.name.toLowerCase().includes(q)).slice(0, 8)
  }, [customers, search])

  const filteredOrders = useMemo(() => {
    if (!search) return orders.slice(0, 5)
    const q = search.toLowerCase()
    return orders.filter(o =>
      (o.description?.toLowerCase().includes(q)) ||
      o.id.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [orders, search])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Hledat stránky, zákazníky, zakázky..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>Nic nenalezeno.</CommandEmpty>
        <CommandGroup heading="Stránky">
          {pages.map((p) => (
            <CommandItem key={p.to} onSelect={() => go(p.to)}>
              <p.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{p.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        {filteredCustomers.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Zákazníci">
              {filteredCustomers.map((c) => (
                <CommandItem key={c.id} onSelect={() => go(`/zakaznici/${c.id}`)}>
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{c.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        {filteredOrders.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Zakázky">
              {filteredOrders.map((o) => (
                <CommandItem key={o.id} onSelect={() => go(`/zakazky/${o.id}`)}>
                  <ClipboardList className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{o.description || `Zakázka #${o.id.slice(0, 6)}`}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
