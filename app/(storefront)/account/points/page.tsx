'use client'

import Link from 'next/link'
import { ChevronLeft, Gift, TrendingUp, TrendingDown, RefreshCw, Crown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MOCK_MEMBERS, MOCK_POINTS_LEDGER, MOCK_POINTS_POLICY } from '@/lib/mock-data'
import { AuthGuard } from '@/components/storefront/auth-guard'

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

const TIER_INFO = {
  bronze: { label: 'Bronze', color: 'bg-amber-700', next: 'silver' },
  silver: { label: 'Silver', color: 'bg-slate-400', next: 'gold' },
  gold: { label: 'Gold', color: 'bg-yellow-500', next: 'vip' },
  vip: { label: 'VIP', color: 'bg-purple-600', next: null },
}

const TYPE_ICONS = {
  earn: TrendingUp,
  redeem: TrendingDown,
  expire: RefreshCw,
  adjust: RefreshCw,
}

export default function AccountPointsPage() {
  const member = MOCK_MEMBERS[0]
  const policy = MOCK_POINTS_POLICY
  const ledger = MOCK_POINTS_LEDGER.filter(l => l.member_id === member.id)
  
  const tierInfo = TIER_INFO[member.tier]
  const multiplier = policy.tier_multipliers[member.tier]
  
  // Calculate progress to next tier
  const nextTier = tierInfo.next as keyof typeof policy.tier_thresholds | null
  const nextThreshold = nextTier ? policy.tier_thresholds[nextTier] : null
  const progress = nextThreshold ? Math.min(100, (member.total_spent_vnd / nextThreshold) * 100) : 100

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/account"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        내 계정
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-6">포인트</h1>

      {/* Points Summary Card */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-5 h-5" />
            <span className="text-sm opacity-80">보유 포인트</span>
          </div>
          <p className="text-4xl font-bold">{member.points_balance.toLocaleString()} P</p>
          <p className="text-sm opacity-80 mt-1">= {formatVND(member.points_balance * policy.points_per_vnd)}</p>
        </div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge className={`${tierInfo.color} text-white`}>
                <Crown className="w-3 h-3 mr-1" />
                {tierInfo.label}
              </Badge>
              <span className="text-sm text-muted-foreground">적립 {multiplier}x</span>
            </div>
            {nextTier && (
              <span className="text-xs text-muted-foreground">
                다음 등급까지 {formatVND(nextThreshold! - member.total_spent_vnd)}
              </span>
            )}
          </div>
          {nextTier && (
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${tierInfo.color} transition-all`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Policy Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">포인트 안내</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• 주문 금액의 {policy.earn_rate_percent}% 적립 (등급별 배율 적용)</p>
          <p>• 최소 {formatVND(policy.min_order_to_earn_vnd)} 이상 주문 시 적립</p>
          <p>• 1P = {policy.points_per_vnd.toLocaleString()} VND</p>
          <p>• 최소 {policy.min_points_to_redeem.toLocaleString()}P부터 사용 가능</p>
          <p>• 주문 금액의 최대 {policy.max_redeem_percent}%까지 포인트 사용</p>
          <p>• 포인트 유효기간: {policy.expiry_months}개월</p>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <h2 className="font-semibold mb-4">적립/사용 내역</h2>
      {ledger.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">내역이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {ledger.map(entry => {
            const Icon = TYPE_ICONS[entry.type]
            const isPositive = entry.amount > 0
            return (
              <Card key={entry.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPositive ? 'bg-ok/10' : 'bg-destructive/10'}`}>
                    <Icon className={`w-5 h-5 ${isPositive ? 'text-ok' : 'text-destructive'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{entry.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isPositive ? 'text-ok' : 'text-destructive'}`}>
                      {isPositive ? '+' : ''}{entry.amount.toLocaleString()} P
                    </p>
                    <p className="text-xs text-muted-foreground">잔액 {entry.balance_after.toLocaleString()} P</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      </div>
    </AuthGuard>
  )
}
