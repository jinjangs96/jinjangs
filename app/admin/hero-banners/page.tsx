'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Edit, Trash2, GripVertical, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { MOCK_HERO_BANNERS } from '@/lib/mock-data'
import type { HeroBanner } from '@/lib/types'
import { toast } from 'sonner'
import { useAdminLocale } from '@/lib/admin-locale-context'
import { ADMIN_HERO_BANNERS_LABELS, ADMIN_COMMON_LABELS, getAdminLabel } from '@/lib/admin-i18n'

export default function AdminHeroBannersPage() {
  const { locale } = useAdminLocale()
  const [banners, setBanners] = useState(MOCK_HERO_BANNERS)
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const sortedBanners = [...banners].sort((a, b) => a.sort_order - b.sort_order)

  const handleToggleActive = (bannerId: string) => {
    setBanners(prev => prev.map(b =>
      b.id === bannerId ? { ...b, is_active: !b.is_active } : b
    ))
    toast.success(getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'status_changed'))
  }

  const handleEdit = (banner: HeroBanner) => {
    setEditingBanner(banner)
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setEditingBanner({
      id: `banner-${Date.now()}`,
      image_url: '',
      link_url: '',
      alt_text: '',
      is_active: true,
      sort_order: banners.length + 1,
      created_at: new Date().toISOString(),
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!editingBanner) return
    if (!editingBanner.image_url) {
      toast.error(getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'image_required'))
      return
    }

    const exists = banners.find(b => b.id === editingBanner.id)
    if (exists) {
      setBanners(prev => prev.map(b =>
        b.id === editingBanner.id ? editingBanner : b
      ))
    } else {
      setBanners(prev => [...prev, editingBanner])
    }
    setIsDialogOpen(false)
    setEditingBanner(null)
    toast.success(getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'save_success'))
  }

  const handleDelete = (bannerId: string) => {
    if (!confirm(getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'confirm_delete'))) return
    setBanners(prev => prev.filter(b => b.id !== bannerId))
    toast.success(getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'delete_success'))
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'page_title')}</h1>
          <p className="text-sm text-muted-foreground">{getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'page_subtitle')}</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" />
          {getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'add_banner')}
        </Button>
      </div>

      {/* Banner List */}
      <div className="space-y-4">
        {sortedBanners.map((banner, index) => (
          <Card key={banner.id} className={!banner.is_active ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Drag Handle & Image */}
                <div className="flex items-start gap-3">
                  <div className="hidden sm:flex items-center justify-center w-8 h-8 text-muted-foreground">
                    <GripVertical className="w-5 h-5 cursor-grab" />
                  </div>
                  <div className="relative w-full sm:w-48 aspect-[3/1] rounded-lg overflow-hidden bg-muted">
                    {banner.image_url ? (
                      <Image
                        src={banner.image_url}
                        alt={banner.alt_text}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        {getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'no_image')}
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-foreground/80 text-background text-xs px-2 py-0.5 rounded">
                      #{index + 1}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{banner.alt_text || getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'no_desc')}</p>
                  {banner.link_url && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate">{banner.link_url}</span>
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={banner.is_active}
                        onCheckedChange={() => handleToggleActive(banner.id)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {banner.is_active ? getAdminLabel(locale, ADMIN_COMMON_LABELS, 'status_active') : getAdminLabel(locale, ADMIN_COMMON_LABELS, 'status_inactive')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:flex-col">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(banner)}>
                    <Edit className="w-4 h-4 sm:mr-0 mr-2" />
                    <span className="sm:hidden">{getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'edit')}</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(banner.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4 sm:mr-0 mr-2" />
                    <span className="sm:hidden">{getAdminLabel(locale, ADMIN_COMMON_LABELS, 'delete')}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {banners.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'empty')}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBanner?.id.startsWith('banner-') && !banners.find(b => b.id === editingBanner?.id) ? getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'dialog_title_add') : getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'dialog_title_edit')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'image_url')}</Label>
              <Input
                value={editingBanner?.image_url || ''}
                onChange={(e) => setEditingBanner(prev => prev ? { ...prev, image_url: e.target.value } : null)}
                placeholder={getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'image_url_placeholder')}
              />
            </div>
            <div>
              <Label>{getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'link_url')}</Label>
              <Input
                value={editingBanner?.link_url || ''}
                onChange={(e) => setEditingBanner(prev => prev ? { ...prev, link_url: e.target.value } : null)}
                placeholder={getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'link_url_placeholder')}
              />
            </div>
            <div>
              <Label>{getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'alt_text')}</Label>
              <Input
                value={editingBanner?.alt_text || ''}
                onChange={(e) => setEditingBanner(prev => prev ? { ...prev, alt_text: e.target.value } : null)}
                placeholder={getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'alt_placeholder')}
              />
            </div>
            <div>
              <Label>{getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'sort_order')}</Label>
              <Input
                type="number"
                min="1"
                value={editingBanner?.sort_order || 1}
                onChange={(e) => setEditingBanner(prev => prev ? { ...prev, sort_order: parseInt(e.target.value) || 1 } : null)}
              />
            </div>

            {/* Preview */}
            {editingBanner?.image_url && (
              <div>
                <Label>{getAdminLabel(locale, ADMIN_HERO_BANNERS_LABELS, 'preview')}</Label>
                <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden bg-muted mt-2">
                  <Image
                    src={editingBanner.image_url}
                    alt={editingBanner.alt_text}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{getAdminLabel(locale, ADMIN_COMMON_LABELS, 'cancel')}</Button>
            <Button onClick={handleSave}>{getAdminLabel(locale, ADMIN_COMMON_LABELS, 'save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
