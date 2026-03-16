'use client'

import { useState } from 'react'
import { Edit, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MOCK_POINTS_LEDGER, MOCK_POINTS_POLICY, MOCK_MEMBERS } from '@/lib/mock-data'

export default function PointsPage() {
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null)

  const getMemberName = (memberId: string) => {
    return MOCK_MEMBERS.find(m => m.id === memberId)?.name || '알 수 없음'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">포인트 관리</h1>
        <p className="text-muted-foreground mt-1">포인트 정책 설정 및 거래 내역</p>
      </div>

      {/* Policy Settings */}
      <Card className="border-primary/30">
        <CardHeader className="bg-secondary/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">포인트 정책</CardTitle>
            <Button size="sm" variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              수정
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earning Rules */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">적립 규칙</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">적립률</p>
                  <p className="font-semibold text-foreground">{MOCK_POINTS_POLICY.earn_rate_percent}% / 주문 총액</p>
                </div>
                <div>
                  <p className="text-muted-foreground">최소 적립 주문금액</p>
                  <p className="font-semibold text-foreground">{MOCK_POINTS_POLICY.min_order_to_earn_vnd.toLocaleString()} VND</p>
                </div>
                <div>
                  <p className="text-muted-foreground">포인트 가치</p>
                  <p className="font-semibold text-foreground">1 포인트 = {MOCK_POINTS_POLICY.points_per_vnd.toLocaleString()} VND</p>
                </div>
              </div>
            </div>

            {/* Redemption Rules */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">사용 규칙</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">최소 사용 포인트</p>
                  <p className="font-semibold text-foreground">{MOCK_POINTS_POLICY.min_points_to_redeem.toLocaleString()} 포인트</p>
                </div>
                <div>
                  <p className="text-muted-foreground">최대 사용 비율</p>
                  <p className="font-semibold text-foreground">주문 총액의 {MOCK_POINTS_POLICY.max_redeem_percent}%까지</p>
                </div>
                <div>
                  <p className="text-muted-foreground">포인트 유효기간</p>
                  <p className="font-semibold text-foreground">{MOCK_POINTS_POLICY.expiry_months}개월</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tier Multipliers */}
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="font-semibold text-foreground mb-4">회원 등급별 적립배수</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { tier: 'bronze', label: '브론즈', multiplier: MOCK_POINTS_POLICY.tier_multipliers.bronze },
                { tier: 'silver', label: '실버', multiplier: MOCK_POINTS_POLICY.tier_multipliers.silver },
                { tier: 'gold', label: '골드', multiplier: MOCK_POINTS_POLICY.tier_multipliers.gold },
                { tier: 'vip', label: 'VIP', multiplier: MOCK_POINTS_POLICY.tier_multipliers.vip },
              ].map(({ tier, label, multiplier }) => (
                <div key={tier} className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold text-primary">{multiplier}x</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tier Thresholds */}
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="font-semibold text-foreground mb-4">등급별 누적 구매액 기준</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">실버 이상</span>
                <span className="font-semibold text-foreground">{MOCK_POINTS_POLICY.tier_thresholds.silver.toLocaleString()} VND</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">골드 이상</span>
                <span className="font-semibold text-foreground">{MOCK_POINTS_POLICY.tier_thresholds.gold.toLocaleString()} VND</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">VIP 이상</span>
                <span className="font-semibold text-foreground">{MOCK_POINTS_POLICY.tier_thresholds.vip.toLocaleString()} VND</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">포인트 거래 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_POINTS_LEDGER.map((ledger) => (
              <div key={ledger.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/60 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{getMemberName(ledger.member_id)}</p>
                      <p className="text-xs text-muted-foreground">{ledger.description}</p>
                    </div>
                    <Badge variant={
                      ledger.type === 'earn' ? 'default' :
                      ledger.type === 'redeem' ? 'secondary' :
                      ledger.type === 'expire' ? 'destructive' :
                      'outline'
                    } className="text-xs">
                      {ledger.type === 'earn' && '적립'}
                      {ledger.type === 'redeem' && '사용'}
                      {ledger.type === 'expire' && '만료'}
                      {ledger.type === 'adjust' && '조정'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(ledger.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className={`text-lg font-bold ${ledger.amount > 0 ? 'text-ok' : 'text-destructive'}`}>
                    {ledger.amount > 0 ? '+' : ''}{ledger.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    잔액: {ledger.balance_after.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
