import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import AppSidebar from '@/components/app/AppSidebar'
import CommandPalette from '@/components/app/CommandPalette'
import BottomNav from './BottomNav'

export default function AppLayout() {
  const [commandOpen, setCommandOpen] = useState(false)
  const location = useLocation()

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar onCommandOpen={() => setCommandOpen(true)} />
        <SidebarInset>
          {/* Top bar */}
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 !h-4" />
            <span className="text-sm text-muted-foreground truncate">
              {getPageTitle(location.pathname)}
            </span>
          </header>
          <main className="flex-1 pb-16 md:pb-0">
            <div key={location.pathname} className="px-4 py-6 md:px-8 page-enter">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
        <BottomNav />
        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      </SidebarProvider>
    </TooltipProvider>
  )
}

function getPageTitle(path: string): string {
  const map: Record<string, string> = {
    '/': 'Nástěnka',
    '/zakazky': 'Zakázky',
    '/zarizeni': 'Zařízení',
    '/zakaznici': 'Zákazníci',
    '/revizni-zpravy': 'Revizní zprávy',
    '/lhutnik': 'Lhůtník',
    '/harmonogramy': 'Harmonogramy',
    '/finance': 'Finance',
    '/nastaveni': 'Nastavení',
  }
  for (const [prefix, title] of Object.entries(map)) {
    if (path === prefix || (prefix !== '/' && path.startsWith(prefix))) return title
  }
  return ''
}
