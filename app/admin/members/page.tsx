'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useAdminLocale } from '@/lib/admin-locale-context'
import { ADMIN_MEMBERS_LABELS, getAdminLabel } from '@/lib/admin-i18n'

type Member = {
  id: string
  name: string
  phone: string
  tier: 'bronze' | 'silver' | 'gold' | 'vip'
  points_balance: number
  total_orders: number
  total_spent_vnd: number
}

const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  bronze: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  silver: { bg: 'bg-slate-100', text: 'text-slate-800' },
  gold: { bg: 'bg-amber-100', text: 'text-amber-800' },
  vip: { bg: 'bg-purple-100', text: 'text-purple-800' },
}

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
}

export default function MembersPage() {
  const { locale } = useAdminLocale()
  const [members, setMembers] = useState<Member[]>([])
  const [summary, setSummary] = useState({
    totalMembers: 0,
    byRole: {
      owner: 0,
      ops_manager: 0,
      finance: 0,
      staff: 0,
      viewer: 0,
    },
  })
  const [errors, setErrors] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTier, setSelectedTier] = useState<string | null>(null)

  useEffect(() => {
    async function loadMembers() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token ?? ''
        const response = await fetch('/api/admin/members/summary', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
          credentials: 'include',
        })
        const result = (await response.json()) as {
          ok?: boolean
          totalMembers?: number
          byRole?: {
            owner?: number
            ops_manager?: number
            finance?: number
            staff?: number
            viewer?: number
          }
          errors?: string[]
          members?: Member[]
        }
        if (!response.ok) {
          toast.error(getAdminLabel(locale, ADMIN_MEMBERS_LABELS, 'load_failed'))
          setMembers([])
          setErrors([])
          return
        }
        // 이전 응답 형식과의 호환(있으면 목록 사용)
        setMembers(result.members ?? [])
        setSummary({
          totalMembers: result.totalMembers ?? 0,
          byRole: {
            owner: result.byRole?.owner ?? 0,
            ops_manager: result.byRole?.ops_manager ?? 0,
            finance: result.byRole?.finance ?? 0,
            staff: result.byRole?.staff ?? 0,
            viewer: result.byRole?.viewer ?? 0,
          },
        })
        setErrors(result.errors ?? [])
      } catch (error) {
        toast.error(getAdminLabel(locale, ADMIN_MEMBERS_LABELS, 'load_error'))
        setMembers([])
        setErrors([])
      }
    }
    loadMembers()
  }, [])

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone.includes(searchQuery)
      const matchesTier = !selectedTier || member.tier === selectedTier
      return matchesSearch && matchesTier
    })
  }, [members, searchQuery, selectedTier])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{getAdminLabel(locale, ADMIN_MEMBERS_LABELS, 'page_title')}</h1>
        <p className="text-muted-foreground mt-1">{getAdminLabel(locale, ADMIN_MEMBERS_LABELS, 'page_subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{summary.totalMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">{getAdminLabel(locale, ADMIN_MEMBERS_LABELS, 'total_members')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-wood">{summary.byRole.owner + summary.byRole.ops_manager}</div>
            <p className="text-xs text-muted-foreground mt-1">{getAdminLabel(locale, ADMIN_MEMBERS_LABELS, 'admin_count')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{summary.byRole.finance}</div>
            <p className="text-xs text-muted-foreground mt-1">{getAdminLabel(locale, ADMIN_MEMBERS_LABELS, 'finance_count')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-ok">{summary.byRole.staff + summary.byRole.viewer}</div>
            <p className="text-xs text-muted-foreground mt-1">{getAdminLabel(locale, ADMIN_MEMBERS_LABELS, 'staff_viewer_count')}</p>
          </CardContent>
        </Card>
      </div>

      {errors.length > 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-amber-700">
            {getAdminLabel(locale, ADMIN_MEMBERS_LABELS, 'partial_error')}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{getAdminLabel(locale, ADMIN_MEMBERS_LABELS, 'filter_title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={getAdminLabel(locale, ADMIN_MEMBERS_LABELS, 'search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { value: null, labelKey: 'tier_all' },
              { value: 'vip', labelKey: 'tier_vip' },
              { value: 'gold', labelKey: 'tier_gold' },
              { value: 'silver', labelKey: 'tier_silver' },
              { value: 'bronze', labelKey: 'tier_bronze' },
            ].map((tier) => (
              <Button
                key={tier.value}
                variant={selectedTier === tier.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTier(tier.value as any)}
              >
                {getAdminLabel(locale, ADMIN_MEMBERS_LABELS, tier.labelKey)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{getAdminLabel(locale, ADMIN_MEMBERS_LABELS, 'list_title')} ({getAdminLabel(locale, ADMIN_MEMBERS_LABELS, 'list_count').replace('{n}', String(filteredMembers.length))})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {getAdminLabel(locale, ADMIN_MEMBERS_LABELS, 'empty')}
            </p>
          ) : (
            <div className="space-y-3">
            {filteredMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/60 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-foreground truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.phone}</p>
                    </div>
                    <Badge className={`${TIER_COLORS[member.tier].bg} ${TIER_COLORS[member.tier].text} text-xs`}>
                      {member.tier.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex gap-6 mt-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">{getAdminLabel(locale, ADMIN_MEMBERS_LABELS, 'orders_count')}</p>
                      <p className="font-semibold text-foreground">{getAdminLabel(locale, ADMIN_MEMBERS_LABELS, 'orders_times_format').replace('{n}', String(member.total_orders))}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{getAdminLabel(locale, ADMIN_MEMBERS_LABELS, 'total_spent')}</p>
                      <p className="font-semibold text-foreground">{formatVND(member.total_spent_vnd)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{getAdminLabel(locale, ADMIN_MEMBERS_LABELS, 'points')}</p>
                      <p className="font-semibold text-primary">{member.points_balance.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <Button variant="ghost" size="sm" className="text-xs">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
