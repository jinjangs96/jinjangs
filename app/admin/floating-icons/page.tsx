'use client'

import { useState } from 'react'
import { Edit, Trash2, Plus, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MOCK_FLOATING_ICONS } from '@/lib/mock-data'

export default function FloatingIconsPage() {
  const [icons, setIcons] = useState(MOCK_FLOATING_ICONS)

  const handleToggle = (id: string) => {
    setIcons(icons.map(icon => 
      icon.id === id ? { ...icon, is_active: !icon.is_active } : icon
    ))
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'zalo': 'Zalo',
      'phone': '전화',
      'kakao': '카카오톡',
      'custom': '커스텀',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">플로팅 아이콘</h1>
          <p className="text-muted-foreground mt-1">고객 접근용 플로팅 아이콘 관리</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          추가
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-primary/30 bg-secondary/10">
        <CardContent className="pt-6">
          <p className="text-sm text-foreground">
            플로팅 아이콘은 웹사이트의 우측 하단 코너에 표시되며, 고객이 Zalo, 전화, 카카오톡 등으로 즉시 연락할 수 있게 합니다.
          </p>
        </CardContent>
      </Card>

      {/* Icons List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">활성 아이콘 ({icons.filter(i => i.is_active).length})</CardTitle>
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
                      {icon.is_active ? '비활성화' : '활성화'}
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
          <CardTitle className="text-lg">URL 형식 예시</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Zalo</p>
              <p className="font-mono bg-muted p-2 rounded text-xs">https://zalo.me/your_phone_number</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">전화</p>
              <p className="font-mono bg-muted p-2 rounded text-xs">tel:+84901234567</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">카카오톡</p>
              <p className="font-mono bg-muted p-2 rounded text-xs">https://pf.kakao.com/your_channel</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">외부 링크</p>
              <p className="font-mono bg-muted p-2 rounded text-xs">https://example.com</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
