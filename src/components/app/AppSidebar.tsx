import { useLocation, useNavigate } from 'react-router-dom'
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
  Search,
  Flame,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const mainNav = [
  { to: '/', icon: Home, label: 'Nástěnka' },
  { to: '/zakazky', icon: ClipboardList, label: 'Zakázky' },
  { to: '/zarizeni', icon: Wrench, label: 'Zařízení' },
  { to: '/zakaznici', icon: Users, label: 'Zákazníci' },
]

const reportsNav = [
  { to: '/revizni-zpravy', icon: FileText, label: 'Revizní zprávy' },
  { to: '/lhutnik', icon: Clock, label: 'Lhůtník' },
  { to: '/harmonogramy', icon: CalendarRange, label: 'Harmonogramy' },
]

const otherNav = [
  { to: '/finance', icon: Banknote, label: 'Finance' },
  { to: '/nastaveni', icon: Settings, label: 'Nastavení' },
]

interface AppSidebarProps {
  onCommandOpen: () => void
}

export default function AppSidebar({ onCommandOpen }: AppSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/'
    return location.pathname.startsWith(to)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent"
              onClick={() => navigate('/')}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-foreground text-background">
                <Flame className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">RevizePlyn</span>
                <span className="text-xs text-muted-foreground">Demo verze</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Search trigger */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onCommandOpen}
              className="text-muted-foreground"
            >
              <Search className="size-4" />
              <span>Hledat...</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Hlavní</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    isActive={isActive(item.to)}
                    onClick={() => navigate(item.to)}
                    tooltip={item.label}
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Revize</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reportsNav.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    isActive={isActive(item.to)}
                    onClick={() => navigate(item.to)}
                    tooltip={item.label}
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Ostatní</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherNav.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    isActive={isActive(item.to)}
                    onClick={() => navigate(item.to)}
                    tooltip={item.label}
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="text-xs text-muted-foreground" size="sm">
              <span>v0.1 · Demo</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
