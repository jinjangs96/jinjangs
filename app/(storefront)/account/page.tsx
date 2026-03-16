'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, ShoppingBag, Gift, Settings, MapPin, ChevronRight, LogOut, Crown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { AuthGuard } from '@/components/storefront/auth-guard'

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
}

const TIER_LABELS = {
  bronze: { label: 'Bronze', color: 'bg-amber-700' },
  silver: { label: 'Silver', color: 'bg-slate-400' },
  gold: { label: 'Gold', color: 'bg-yellow-500' },
  vip: { label: 'VIP', color: 'bg-purple-600' },
}

export default function AccountPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [orders, setOrders] = useState<Record<string, unknown>[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadAccountData() {
      if (!user) return

      setIsLoading(true)
      try {
        const supabase = getSupabaseBrowserClient()

        const [{ data: profileData }, { data: ordersData }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        ])

        setProfile(profileData ?? null)
        setOrders(ordersData ?? [])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '계정 정보를 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadAccountData()
  }, [user])

  const summary = useMemo(() => {
    const totalOrders = orders.length
    const totalSpent = orders.reduce((acc, order) => {
      const rawAmount = order.total_amount_vnd ?? order.total_vnd ?? 0
      const amount = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount)
      return Number.isFinite(amount) ? acc + amount : acc
    }, 0)

    const latestOrderDate = orders[0]?.created_at
    return { totalOrders, totalSpent, latestOrderDate }
  }, [orders])

  const displayName =
    (typeof profile?.full_name === 'string' && profile.full_name) ||
    (typeof user?.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
    user?.email ||
    '회원'
  const displayPhone =
    (typeof profile?.phone === 'string' && profile.phone) ||
    (typeof user?.user_metadata?.phone === 'string' && user.user_metadata.phone) ||
    '전화번호 미등록'
  const points = typeof profile?.points_balance === 'number' ? profile.points_balance : 0
  const tierKey = typeof profile?.tier === 'string' && profile.tier in TIER_LABELS ? profile.tier : 'bronze'
  const tierInfo = TIER_LABELS[tierKey as keyof typeof TIER_LABELS]

  const MENU_ITEMS = [
    { href: '/account/orders', label: '주문 내역', icon: ShoppingBag, description: '주문 확인 및 배달 추적' },
    { href: '/account/addresses', label: '배송 주소', icon: MapPin, description: '주소 추가 및 관리' },
    { href: '/account/points', label: '포인트', icon: Gift, description: `${points.toLocaleString()} P 보유` },
    { href: '/account/settings', label: '계정 설정', icon: Settings, description: '개인정보 수정' },
  ]

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('로그아웃 되었습니다.')
      router.push('/login')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '로그아웃 중 오류가 발생했습니다.')
    }
  }

  return (
    <AuthGuard>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">내 계정</h1>

        {/* Profile Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold">{displayName}</h2>
                  <Badge className={`${tierInfo.color} text-white text-xs flex-shrink-0`}>
                    <Crown className="w-3 h-3 mr-1" />
                    {tierInfo.label}
                  </Badge>
                </div>
                <p className="text-primary-foreground/80 text-sm">{displayPhone}</p>
              </div>
            </div>
          </div>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 sm:grid-cols-2 divide-x divide-border">
              <div className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{summary.totalOrders}</p>
                <p className="text-xs text-muted-foreground">총 주문</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{points.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">보유 포인트</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">총 지출</p>
            <p className="text-lg sm:text-xl font-bold text-primary">{formatVND(summary.totalSpent)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">마지막 주문</p>
            <p className="text-sm font-medium">
              {summary.latestOrderDate
                ? new Date(String(summary.latestOrderDate)).toLocaleDateString('ko-KR')
                : '주문 없음'}
            </p>
          </Card>
        </div>

        {/* Menu Items - with fixed spacing */}
        <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
          {MENU_ITEMS.map(item => (
            <Link key={item.href} href={item.href} className="block">
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base">{item.label}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
          disabled={isLoading}
        >
          <LogOut className="w-4 h-4 mr-2" />
          로그아웃
        </Button>
      </div>
    </AuthGuard>
  )
}
