'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Bell,
  LogOut,
  Menu,
  X,
  ChefHat,
  Package,
  Users,
  Gift,
  Image,
  Settings,
  FileText,
  MousePointer,
  Footprints,
  Warehouse,
  ArrowRightLeft,
  MapPin,
  BarChart3,
  CalendarDays,
  TrendingUp,
  UserPlus,
  ClipboardList,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StaffProvider, useStaff } from '@/lib/staff-context'
import { AdminLocaleProvider, useAdminLocale } from '@/lib/admin-locale-context'
import { getAdminLabel, ADMIN_SIDEBAR_LABELS, ADMIN_ROLE_LABELS, ADMIN_ACCESS_LABELS } from '@/lib/admin-i18n'
import type { StaffPermission } from '@/lib/types'

interface NavItem {
  href: string
  labelKey: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  permission?: StaffPermission
}

interface NavSection {
  titleKey: string
  items: NavItem[]
}

const NAV_STRUCTURE: NavSection[] = [
  {
    titleKey: 'section_orders',
    items: [
      { href: '/admin/dashboard', labelKey: 'nav_dashboard', icon: LayoutDashboard },
      { href: '/admin/orders', labelKey: 'nav_orders', icon: ShoppingBag, badge: 3, permission: 'orders.view' },
      { href: '/admin/manual-orders/new', labelKey: 'nav_manual_order', icon: ClipboardList, permission: 'orders.create' },
    ],
  },
  {
    titleKey: 'section_inventory',
    items: [
      { href: '/admin/inventory', labelKey: 'nav_inventory', icon: Warehouse, permission: 'inventory.view' },
      { href: '/admin/inventory/movements', labelKey: 'nav_movements', icon: ArrowRightLeft, permission: 'inventory.view' },
    ],
  },
  {
    titleKey: 'section_products',
    items: [
      { href: '/admin/products', labelKey: 'nav_products', icon: Package, permission: 'products.view' },
      { href: '/admin/hero-banners', labelKey: 'nav_banners', icon: Image, permission: 'settings.edit' },
    ],
  },
  {
    titleKey: 'section_payment_delivery',
    items: [
      { href: '/admin/payment-reconciliation', labelKey: 'nav_payment_recon', icon: CreditCard, permission: 'payments.view' },
      { href: '/admin/delivery-zones', labelKey: 'nav_delivery_zones', icon: MapPin, permission: 'settings.view' },
      { href: '/admin/bank-accounts', labelKey: 'nav_bank_accounts', icon: CreditCard, permission: 'settings.view' },
    ],
  },
  {
    titleKey: 'section_reports',
    items: [
      { href: '/admin/reports', labelKey: 'nav_sales_summary', icon: BarChart3, permission: 'reports.view' },
      { href: '/admin/reports/monthly', labelKey: 'nav_monthly', icon: CalendarDays, permission: 'reports.view' },
      { href: '/admin/reports/products', labelKey: 'nav_products_analysis', icon: TrendingUp, permission: 'reports.view' },
    ],
  },
  {
    titleKey: 'section_members',
    items: [
      { href: '/admin/members', labelKey: 'nav_members', icon: Users, permission: 'orders.view' },
      { href: '/admin/reviews', labelKey: 'nav_reviews', icon: Star, permission: 'orders.view' },
      { href: '/admin/points', labelKey: 'nav_points', icon: Gift, permission: 'settings.view' },
    ],
  },
  {
    titleKey: 'section_system',
    items: [
      { href: '/admin/users', labelKey: 'nav_users', icon: UserPlus, permission: 'users.view' },
      { href: '/admin/notifications', labelKey: 'nav_notifications', icon: Bell, permission: 'settings.view' },
      { href: '/admin/floating-icons', labelKey: 'nav_floating_icons', icon: MousePointer, permission: 'settings.edit' },
      { href: '/admin/footer', labelKey: 'nav_footer', icon: Footprints, permission: 'settings.edit' },
      { href: '/admin/site-settings', labelKey: 'nav_site_settings', icon: Settings, permission: 'settings.edit' },
      { href: '/admin/policies', labelKey: 'nav_policies', icon: FileText, permission: 'settings.edit' },
    ],
  },
]

function AdminSidebar({ 
  sidebarOpen, 
  setSidebarOpen 
}: { 
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void 
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { locale, setLocale } = useAdminLocale()
  const { currentStaff, hasPermission, logout } = useStaff()

  const handleLogout = async () => {
    await logout()
    router.push('/admin/login')
  }

  const navSections = useMemo(() =>
    NAV_STRUCTURE.map(section => ({
      title: getAdminLabel(locale, ADMIN_SIDEBAR_LABELS, section.titleKey),
      items: section.items
        .filter(item => !item.permission || hasPermission(item.permission))
        .map(item => ({
          ...item,
          label: getAdminLabel(locale, ADMIN_SIDEBAR_LABELS, item.labelKey),
        })),
    })).filter(section => section.items.length > 0),
    [locale, hasPermission]
  )

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-40 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <ChefHat className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm leading-tight text-sidebar-foreground truncate">Jin Jang's Kitchen</p>
          <p className="text-xs text-muted-foreground">{getAdminLabel(locale, ADMIN_SIDEBAR_LABELS, 'erp_admin')}</p>
        </div>
        <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map(({ href, label, icon: Icon, badge }) => {
                const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                      active
                        ? 'bg-sidebar-accent text-sidebar-primary font-semibold'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-sidebar-primary' : 'text-muted-foreground')} />
                    <span className="flex-1">{label}</span>
                    {badge && (
                      <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0 h-5">
                        {badge}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Locale toggle */}
      <div className="px-3 py-2 border-t border-sidebar-border">
        <div className="flex gap-1">
          <button
            onClick={() => setLocale('ko')}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
              locale === 'ko' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/50'
            )}
          >
            KO
          </button>
          <button
            onClick={() => setLocale('vi')}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
              locale === 'vi' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/50'
            )}
          >
            VI
          </button>
        </div>
      </div>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
            {currentStaff?.name?.[0] || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{currentStaff?.name || getAdminLabel(locale, ADMIN_SIDEBAR_LABELS, 'not_logged_in')}</p>
            <p className="text-xs text-muted-foreground">
              {currentStaff ? getAdminLabel(locale, ADMIN_ROLE_LABELS, currentStaff.role) : '-'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-sidebar-accent/50 hover:text-destructive transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          {getAdminLabel(locale, ADMIN_SIDEBAR_LABELS, 'logout')}
        </button>
      </div>
    </aside>
  )
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { locale } = useAdminLocale()
  const { currentStaff, isLoading, canAccess } = useStaff()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) return
    if (isLoading) return
    if (currentStaff) return
    const next = encodeURIComponent(pathname || '/admin/dashboard')
    router.replace(`/admin/login?next=${next}`)
  }, [currentStaff, isLoading, isLoginPage, pathname, router])

  if (isLoginPage) return <>{children}</>

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        {getAdminLabel(locale, ADMIN_ACCESS_LABELS, 'checking')}
      </div>
    )
  }

  if (!currentStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        {getAdminLabel(locale, ADMIN_ACCESS_LABELS, 'redirecting')}
      </div>
    )
  }

  if (!canAccess(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center space-y-3">
          <p className="text-lg font-semibold text-foreground">{getAdminLabel(locale, ADMIN_ACCESS_LABELS, 'no_access_title')}</p>
          <p className="text-sm text-muted-foreground">{getAdminLabel(locale, ADMIN_ACCESS_LABELS, 'no_access_desc')}</p>
          <Link href="/admin/dashboard">
            <Button>{getAdminLabel(locale, ADMIN_ACCESS_LABELS, 'go_dashboard')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border sticky top-0 z-20">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm text-foreground">Jin Jang's Kitchen</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffProvider>
      <AdminLocaleProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AdminLocaleProvider>
    </StaffProvider>
  )
}
