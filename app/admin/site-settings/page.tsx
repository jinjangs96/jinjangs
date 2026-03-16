'use client'

import { useState, useEffect } from 'react'
import { Save, Edit, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MOCK_SITE_SETTINGS } from '@/lib/mock-data'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState(MOCK_SITE_SETTINGS)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token ?? ''
        const res = await fetch('/api/admin/site-settings', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const result = (await res.json()) as Record<string, unknown>
        if (cancelled) return
        if (!res.ok) return
        setSettings(prev => ({ ...prev, ...result }))
      } catch {
        if (cancelled) return
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSocialChange = (platform: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value
      }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token ?? ''
      const res = await fetch('/api/admin/site-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          site_name_ko: settings.site_name_ko,
          tagline_ko: settings.tagline_ko,
          logo_url: settings.logo_url,
          contact_phone: settings.contact_phone,
          contact_email: settings.contact_email,
          contact_address: settings.contact_address,
          operating_hours: settings.operating_hours,
          min_order_vnd: settings.min_order_vnd,
          delivery_fee_vnd: settings.delivery_fee_vnd,
          free_delivery_threshold_vnd: settings.free_delivery_threshold_vnd,
        }),
      })
      const result = (await res.json()) as { error?: string }
      if (!res.ok) {
        toast.error(result.error ?? '저장에 실패했습니다.')
        return
      }
      toast.success('설정이 저장되었습니다.')
      setIsEditing(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const onHeaderButtonClick = () => {
    if (isEditing) handleSave()
    else setIsEditing(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">사이트 설정</h1>
          <p className="text-muted-foreground mt-1">사이트 정보 및 배송 정책</p>
        </div>
        <Button 
          className={isEditing ? 'bg-primary' : 'bg-muted text-foreground'}
          onClick={onHeaderButtonClick}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : isEditing ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              저장
            </>
          ) : (
            <>
              <Edit className="w-4 h-4 mr-2" />
              수정
            </>
          )}
        </Button>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">사이트명 (한국어)</label>
            <Input 
              value={settings.site_name_ko} 
              onChange={(e) => handleChange('site_name_ko', e.target.value)}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">태그라인</label>
            <Input 
              value={settings.tagline_ko} 
              onChange={(e) => handleChange('tagline_ko', e.target.value)}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">로고 URL</label>
            <Input 
              value={settings.logo_url} 
              onChange={(e) => handleChange('logo_url', e.target.value)}
              disabled={!isEditing}
              className="mt-1 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">연락처</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">전화번호</label>
            <Input 
              value={settings.contact_phone} 
              onChange={(e) => handleChange('contact_phone', e.target.value)}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">이메일</label>
            <Input 
              type="email"
              value={settings.contact_email} 
              onChange={(e) => handleChange('contact_email', e.target.value)}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">주소</label>
            <Input 
              value={settings.contact_address} 
              onChange={(e) => handleChange('contact_address', e.target.value)}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">운영 시간</label>
            <Input 
              value={settings.operating_hours} 
              onChange={(e) => handleChange('operating_hours', e.target.value)}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Delivery Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">배송 정책</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">최소 주문금액</label>
            <div className="flex items-center gap-2 mt-1">
              <Input 
                type="number"
                value={settings.min_order_vnd} 
                onChange={(e) => handleChange('min_order_vnd', parseInt(e.target.value))}
                disabled={!isEditing}
              />
              <span className="text-sm text-muted-foreground">VND</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">배송료</label>
            <div className="flex items-center gap-2 mt-1">
              <Input 
                type="number"
                value={settings.delivery_fee_vnd} 
                onChange={(e) => handleChange('delivery_fee_vnd', parseInt(e.target.value))}
                disabled={!isEditing}
              />
              <span className="text-sm text-muted-foreground">VND</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">무료배송 기준금액</label>
            <div className="flex items-center gap-2 mt-1">
              <Input 
                type="number"
                value={settings.free_delivery_threshold_vnd} 
                onChange={(e) => handleChange('free_delivery_threshold_vnd', parseInt(e.target.value))}
                disabled={!isEditing}
              />
              <span className="text-sm text-muted-foreground">VND</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">소셜 링크</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Facebook</label>
            <Input 
              value={settings.social_links.facebook || ''} 
              onChange={(e) => handleSocialChange('facebook', e.target.value)}
              disabled={!isEditing}
              className="mt-1 text-xs"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Instagram</label>
            <Input 
              value={settings.social_links.instagram || ''} 
              onChange={(e) => handleSocialChange('instagram', e.target.value)}
              disabled={!isEditing}
              className="mt-1 text-xs"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Zalo</label>
            <Input 
              value={settings.social_links.zalo || ''} 
              onChange={(e) => handleSocialChange('zalo', e.target.value)}
              disabled={!isEditing}
              className="mt-1 text-xs"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
