'use client'

import { useEffect, useState } from 'react'
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
import { StaffProvider, useStaff, ROLE_LABELS } from '@/lib/staff-context'
import type { StaffPermission } from '@/lib/types'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  permission?: StaffPermission
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: '주문',
    items: [
      { href: '/admin/dashboard', label: '대시보드', icon: LayoutDashboard },
      { href: '/admin/orders', label: '주문 관리', icon: ShoppingBag, badge: 3, permission: 'orders.view' },
      { href: '/admin/manual-orders/new', label: '수동 주문 등록', icon: ClipboardList, permission: 'orders.create' },
    ],
  },
  {
    title: '재고',
    items: [
      { href: '/admin/inventory', label: '재고 현황', icon: Warehouse, permission: 'inventory.view' },
      { href: '/admin/inventory/movements', label: '입출고 내역', icon: ArrowRightLeft, permission: 'inventory.view' },
    ],
  },
  {
    title: '상품',
    items: [
      { href: '/admin/products', label: '메뉴 관리', icon: Package, permission: 'products.view' },
      { href: '/admin/hero-banners', label: '배너 관리', icon: Image, permission: 'settings.edit' },
    ],
  },
  {
    title: '결제/배송',
    items: [
      { href: '/admin/payment-reconciliation', label: '결제 확인', icon: CreditCard, permission: 'payments.view' },
      { href: '/admin/delivery-zones', label: '배송 구역', icon: MapPin, permission: 'settings.view' },
      { href: '/admin/bank-accounts', label: '계좌/QR 관리', icon: CreditCard, permission: 'settings.view' },
    ],
  },
  {
    title: '리포트',
    items: [
      { href: '/admin/reports', label: '매출 요약', icon: BarChart3, permission: 'reports.view' },
      { href: '/admin/reports/monthly', label: '월별 분석', icon: CalendarDays, permission: 'reports.view' },
      { href: '/admin/reports/products', label: '상품별 분석', icon: TrendingUp, permission: 'reports.view' },
    ],
  },
  {
    title: '회원',
    items: [
      { href: '/admin/members', label: '회원 관리', icon: Users, permission: 'orders.view' },
      { href: '/admin/reviews', label: '리뷰 관리', icon: Star, permission: 'orders.view' },
      { href: '/admin/points', label: '포인트 정책', icon: Gift, permission: 'settings.view' },
    ],
  },
  {
    title: '시스템',
    items: [
      { href: '/admin/users', label: '직원 관리', icon: UserPlus, permission: 'users.view' },
      { href: '/admin/notifications', label: '알림 설정', icon: Bell, permission: 'settings.view' },
      { href: '/admin/floating-icons', label: '플로팅 아이콘', icon: MousePointer, permission: 'settings.edit' },
      { href: '/admin/footer', label: '푸터 관리', icon: Footprints, permission: 'settings.edit' },
      { href: '/admin/site-settings', label: '사이트 설정', icon: Settings, permission: 'settings.edit' },
      { href: '/admin/policies', label: '약관/정책', icon: FileText, permission: 'settings.edit' },
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
  const { currentStaff, hasPermission, logout } = useStaff()

  const handleLogout = async () => {
    await logout()
    router.push('/admin/login')
  }

  // Filter nav items based on permissions
  const filteredSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => 
      !item.permission || hasPermission(item.permission)
    ),
  })).filter(section => section.items.length > 0)

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
          <p className="text-xs text-muted-foreground">ERP 어드민</p>
        </div>
        <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {filteredSections.map((section) => (
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

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
            {currentStaff?.name?.[0] || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{currentStaff?.name || '미로그인'}</p>
            <p className="text-xs text-muted-foreground">
              {currentStaff ? ROLE_LABELS[currentStaff.role] : '-'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-sidebar-accent/50 hover:text-destructive transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </div>
    </aside>
  )
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
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
        관리자 권한을 확인하는 중입니다...
      </div>
    )
  }

  if (!currentStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        로그인 페이지로 이동 중입니다...
      </div>
    )
  }

  if (!canAccess(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center space-y-3">
          <p className="text-lg font-semibold text-foreground">접근 권한이 없습니다</p>
          <p className="text-sm text-muted-foreground">현재 계정 역할로는 이 메뉴를 사용할 수 없습니다.</p>
          <Link href="/admin/dashboard">
            <Button>대시보드로 이동</Button>
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
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </StaffProvider>
  )
}
