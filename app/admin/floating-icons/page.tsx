'use client'

import { useState } from 'react'
import { Edit, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MOCK_FLOATING_ICONS } from '@/lib/mock-data'
import { useAdminLocale } from '@/lib/admin-locale-context'
import { ADMIN_FLOATING_ICONS_LABELS, getAdminLabel } from '@/lib/admin-i18n'

export default function FloatingIconsPage() {
  const { locale } = useAdminLocale()
  const [icons, setIcons] = useState(MOCK_FLOATING_ICONS)

  const handleToggle = (id: string) => {
    setIcons(icons.map(icon => 
      icon.id === id ? { ...icon, is_active: !icon.is_active } : icon
    ))
  }

  const getTypeLabel = (type: string) => {
    const keyMap: Record<string, string> = {
      'zalo': 'type_zalo',
      'phone': 'type_phone',
      'kakao': 'type_kakao',
      'custom': 'type_custom',
    }
    const key = keyMap[type]
    return key ? getAdminLabel(locale, ADMIN_FLOATING_ICONS_LABELS, key) : type
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{getAdminLabel(locale, ADMIN_FLOATING_ICONS_LABELS, 'page_title')}</h1>
          <p className="text-muted-foreground mt-1">{getAdminLabel(locale, ADMIN_FLOATING_ICONS_LABELS, 'page_subtitle')}</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          {getAdminLabel(locale, ADMIN_FLOATING_ICONS_LABELS, 'add_btn')}
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-primary/30 bg-secondary/10">
        <CardContent className="pt-6">
          <p className="text-sm text-foreground">
            {getAdminLabel(locale, ADMIN_FLOATING_ICONS_LABELS, 'info_text')}
          </p>
        </CardContent>
      </Card>

      {/* Icons List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{getAdminLabel(locale, ADMIN_FLOATING_ICONS_LABELS, 'active_count_format').replace('{n}', String(icons.filter(i => i.is_active).length))}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {icons.map((icon) => (
              <div key={icon.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/60 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{icon.label_ko}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{icon.url}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <Badge variant={icon.is_active ? 'default' : 'secondary'} className="text-xs">
                    {getTypeLabel(icon.type)}
                  </Badge>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => handleToggle(icon.id)}
                    >
                      {icon.is_active ? getAdminLabel(locale, ADMIN_FLOATING_ICONS_LABELS, 'deactivate') : getAdminLabel(locale, ADMIN_FLOATING_ICONS_LABELS, 'activate')}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* URL Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{getAdminLabel(locale, ADMIN_FLOATING_ICONS_LABELS, 'url_examples_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">{getAdminLabel(locale, ADMIN_FLOATING_ICONS_LABELS, 'url_zalo')}</p>
              <p className="font-mono bg-muted p-2 rounded text-xs">https://zalo.me/your_phone_number</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">{getAdminLabel(locale, ADMIN_FLOATING_ICONS_LABELS, 'url_phone')}</p>
              <p className="font-mono bg-muted p-2 rounded text-xs">tel:+84901234567</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">{getAdminLabel(locale, ADMIN_FLOATING_ICONS_LABELS, 'url_kakao')}</p>
              <p className="font-mono bg-muted p-2 rounded text-xs">https://pf.kakao.com/your_channel</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">{getAdminLabel(locale, ADMIN_FLOATING_ICONS_LABELS, 'url_external')}</p>
              <p className="font-mono bg-muted p-2 rounded text-xs">https://example.com</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
