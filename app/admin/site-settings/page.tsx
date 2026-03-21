'use client'

import { useState, useEffect } from 'react'
import { Save, Edit, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MOCK_SITE_SETTINGS } from '@/lib/mock-data'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAdminLocale } from '@/lib/admin-locale-context'
import { getAdminLabel, ADMIN_SITE_SETTINGS_LABELS, ADMIN_COMMON_LABELS } from '@/lib/admin-i18n'

export default function SiteSettingsPage() {
  const { locale } = useAdminLocale()
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
        toast.error(result.error ?? getAdminLabel(locale, ADMIN_SITE_SETTINGS_LABELS, 'save_failed'))
        return
      }
      toast.success(getAdminLabel(locale, ADMIN_SITE_SETTINGS_LABELS, 'save_success'))
      setIsEditing(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : getAdminLabel(locale, ADMIN_SITE_SETTINGS_LABELS, 'save_error'))
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
          <h1 className="text-3xl font-bold text-foreground">{getAdminLabel(locale, ADMIN_SITE_SETTINGS_LABELS, 'page_title')}</h1>
          <p className="text-muted-foreground mt-1">{getAdminLabel(locale, ADMIN_SITE_SETTINGS_LABELS, 'page_subtitle')}</p>
        </div>
        <Button 
          className={isEditing ? 'bg-primary' : 'bg-muted text-foreground'}
          onClick={onHeaderButtonClick}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {getAdminLabel(locale, ADMIN_COMMON_LABELS, 'saving')}
            </>
          ) : isEditing ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              {getAdminLabel(locale, ADMIN_COMMON_LABELS, 'save')}
            </>
          ) : (
            <>
              <Edit className="w-4 h-4 mr-2" />
              {getAdminLabel(locale, ADMIN_COMMON_LABELS, 'edit')}
            </>
          )}
        </Button>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{getAdminLabel(locale, ADMIN_SITE_SETTINGS_LABELS, 'basic_info')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">{getAdminLabel(locale, ADMIN_SITE_SETTINGS_LABELS, 'site_name_ko')}</label>
            <Input 
              value={settings.site_name_ko} 
              onChange={(e) => handleChange('site_name_ko', e.target.value)}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">{getAdminLabel(locale, ADMIN_SITE_SETTINGS_LABELS, 'tagline')}</label>
            <Input 
              value={settings.tagline_ko} 
              onChange={(e) => handleChange('tagline_ko', e.target.value)}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">{getAdminLabel(locale, ADMIN_SITE_SETTINGS_LABELS, 'logo_url')}</label>
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
          <CardTitle className="text-lg">{getAdminLabel(locale, ADMIN_SITE_SETTINGS_LABELS, 'contact')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">{getAdminLabel(locale, ADMIN_SITE_SETTINGS_LABELS, 'phone')}</label>
            <Input 
              value={settings.contact_phone} 
              onChange={(e) => handleChange('contact_phone', e.target.value)}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">{getAdminLabel(locale, ADMIN_SITE_SETTINGS_LABELS, 'email')}</label>
            <Input 
              type="email"
              value={settings.contact_email} 
              onChange={(e) => handleChange('contact_email', e.target.value)}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">{getAdminLabel(locale, ADMIN_SITE_SETTINGS_LABELS, 'address')}</label>
            <Input 
              value={settings.contact_address} 
              onChange={(e) => handleChange('contact_address', e.target.value)}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">{getAdminLabel(locale, ADMIN_SITE_SETTINGS_LABELS, 'hours')}</label>
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
          <CardTitle className="text-lg">{getAdminLabel(locale, ADMIN_SITE_SETTINGS_LABELS, 'delivery_policy')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">{getAdminLabel(locale, ADMIN_SITE_SETTINGS_LABELS, 'min_order')}</label>
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
            <label className="text-sm font-medium text-foreground">{getAdminLabel(locale, ADMIN_SITE_SETTINGS_LABELS, 'delivery_fee')}</label>
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
            <label className="text-sm font-medium text-foreground">{getAdminLabel(locale, ADMIN_SITE_SETTINGS_LABELS, 'free_delivery_threshold')}</label>
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
          <CardTitle className="text-lg">{getAdminLabel(locale, ADMIN_SITE_SETTINGS_LABELS, 'social_links')}</CardTitle>
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
