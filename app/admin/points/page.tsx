'use client'

import { useState } from 'react'
import { Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MOCK_POINTS_LEDGER, MOCK_POINTS_POLICY, MOCK_MEMBERS } from '@/lib/mock-data'
import { useAdminLocale } from '@/lib/admin-locale-context'
import { ADMIN_POINTS_LABELS, ADMIN_COMMON_LABELS, getAdminLabel } from '@/lib/admin-i18n'

export default function PointsPage() {
  const { locale } = useAdminLocale()
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null)

  const getMemberName = (memberId: string) => {
    return MOCK_MEMBERS.find(m => m.id === memberId)?.name || getAdminLabel(locale, ADMIN_POINTS_LABELS, 'unknown')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'page_title')}</h1>
        <p className="text-muted-foreground mt-1">{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'page_subtitle')}</p>
      </div>

      {/* Policy Settings */}
      <Card className="border-primary/30">
        <CardHeader className="bg-secondary/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'policy_title')}</CardTitle>
            <Button size="sm" variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              {getAdminLabel(locale, ADMIN_COMMON_LABELS, 'edit')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earning Rules */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'earn_rules')}</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'earn_rate')}</p>
                  <p className="font-semibold text-foreground">{MOCK_POINTS_POLICY.earn_rate_percent}% {getAdminLabel(locale, ADMIN_POINTS_LABELS, 'earn_rate_suffix')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'min_order_to_earn')}</p>
                  <p className="font-semibold text-foreground">{MOCK_POINTS_POLICY.min_order_to_earn_vnd.toLocaleString()} {getAdminLabel(locale, ADMIN_POINTS_LABELS, 'point_value_suffix')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'point_value')}</p>
                  <p className="font-semibold text-foreground">{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'point_value_display').replace('{n}', MOCK_POINTS_POLICY.points_per_vnd.toLocaleString())}</p>
                </div>
              </div>
            </div>

            {/* Redemption Rules */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'redeem_rules')}</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'min_to_redeem')}</p>
                  <p className="font-semibold text-foreground">{MOCK_POINTS_POLICY.min_points_to_redeem.toLocaleString()} {getAdminLabel(locale, ADMIN_POINTS_LABELS, 'min_redeem_suffix')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'max_redeem')}</p>
                  <p className="font-semibold text-foreground">{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'max_redeem_suffix')} {MOCK_POINTS_POLICY.max_redeem_percent}%{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'max_redeem_suffix2')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'expiry')}</p>
                  <p className="font-semibold text-foreground">{MOCK_POINTS_POLICY.expiry_months}{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'expiry_suffix')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tier Multipliers */}
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="font-semibold text-foreground mb-4">{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'tier_multipliers')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { tier: 'bronze', labelKey: 'tier_bronze', multiplier: MOCK_POINTS_POLICY.tier_multipliers.bronze },
                { tier: 'silver', labelKey: 'tier_silver', multiplier: MOCK_POINTS_POLICY.tier_multipliers.silver },
                { tier: 'gold', labelKey: 'tier_gold', multiplier: MOCK_POINTS_POLICY.tier_multipliers.gold },
                { tier: 'vip', labelKey: 'tier_vip', multiplier: MOCK_POINTS_POLICY.tier_multipliers.vip },
              ].map(({ tier, labelKey, multiplier }) => (
                <div key={tier} className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{getAdminLabel(locale, ADMIN_POINTS_LABELS, labelKey)}</p>
                  <p className="text-2xl font-bold text-primary">{multiplier}x</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tier Thresholds */}
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="font-semibold text-foreground mb-4">{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'tier_thresholds')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'tier_silver_above')}</span>
                <span className="font-semibold text-foreground">{MOCK_POINTS_POLICY.tier_thresholds.silver.toLocaleString()} VND</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'tier_gold_above')}</span>
                <span className="font-semibold text-foreground">{MOCK_POINTS_POLICY.tier_thresholds.gold.toLocaleString()} VND</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'tier_vip_above')}</span>
                <span className="font-semibold text-foreground">{MOCK_POINTS_POLICY.tier_thresholds.vip.toLocaleString()} VND</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{getAdminLabel(locale, ADMIN_POINTS_LABELS, 'ledger_title')}</CardTitle>
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
                      {ledger.type === 'earn' && getAdminLabel(locale, ADMIN_POINTS_LABELS, 'type_earn')}
                      {ledger.type === 'redeem' && getAdminLabel(locale, ADMIN_POINTS_LABELS, 'type_redeem')}
                      {ledger.type === 'expire' && getAdminLabel(locale, ADMIN_POINTS_LABELS, 'type_expire')}
                      {ledger.type === 'adjust' && getAdminLabel(locale, ADMIN_POINTS_LABELS, 'type_adjust')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(ledger.created_at).toLocaleString(locale === 'vi' ? 'vi-VN' : 'ko-KR')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className={`text-lg font-bold ${ledger.amount > 0 ? 'text-ok' : 'text-destructive'}`}>
                    {ledger.amount > 0 ? '+' : ''}{ledger.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getAdminLabel(locale, ADMIN_POINTS_LABELS, 'balance')}: {ledger.balance_after.toLocaleString()}
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
