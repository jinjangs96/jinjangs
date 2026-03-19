'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Plus, Search, Edit, Trash2, GripVertical, Flame, ChevronUp, ChevronDown, ChevronRight, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import type { Product, ProductCategory } from '@/lib/types'
import { toast } from 'sonner'
import { fetchProductsFromSupabase } from '@/lib/products/queries'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount)
}

const hasValidImageSrc = (url: unknown): url is string =>
  typeof url === 'string' && url.trim().length > 0

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  jarred: '장요리',
  poke: '포케',
  sets: '세트/선물',
  sides: '곁들임',
  beverages: '음료',
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingById, setPendingById] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploadingOptionKey, setUploadingOptionKey] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const optionImageInputRef = useRef<HTMLInputElement>(null)
  const optionUploadTargetRef = useRef<{ groupIdx: number; optIdx: number } | null>(null)
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(new Set())
  const initialSnapshotRef = useRef<string | null>(null)

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      if (search) {
        return p.name_ko.toLowerCase().includes(search.toLowerCase())
      }
      return true
    })
  }, [products, categoryFilter, search])

  const sortedProducts = useMemo(
    () => [...filteredProducts].sort((a, b) => a.sort_order - b.sort_order),
    [filteredProducts]
  )

  useEffect(() => {
    void loadProducts()
  }, [])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const data = await fetchProductsFromSupabase()
      setProducts(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '상품 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const getAccessToken = async () => {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? ''
  }

  const getApiError = (result: unknown, fallback: string): string => {
    if (result && typeof result === 'object' && 'error' in result && typeof (result as { error?: unknown }).error === 'string') {
      return (result as { error: string }).error
    }
    return fallback
  }

  const persistProduct = async (nextProduct: Product, opts?: { reload?: boolean }) => {
    setIsSaving(true)
    try {
      const token = await getAccessToken()
      const response = await fetch('/api/admin/products/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product: nextProduct }),
      })

      let result: unknown
      try {
        result = await response.json()
      } catch {
        result = null
      }
      if (!response.ok) {
        toast.error(getApiError(result, '상품 저장에 실패했습니다.'))
        return false
      }

      if (opts?.reload !== false) {
        await loadProducts()
      }
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '상품 저장 중 오류가 발생했습니다.')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleAvailable = async (productId: string) => {
    const target = products.find((item) => item.id === productId)
    if (!target) return
    if (pendingById[productId]) return
    const prev = target.is_available
    const nextValue = !prev
    setPendingById((p) => ({ ...p, [productId]: true }))
    setProducts((prevList) => prevList.map((p) => (p.id === productId ? { ...p, is_available: nextValue } : p)))
    const ok = await persistProduct({ ...target, is_available: nextValue }, { reload: false })
    if (ok) {
      toast.success('판매 상태가 변경되었습니다.')
    } else {
      setProducts((prevList) => prevList.map((p) => (p.id === productId ? { ...p, is_available: prev } : p)))
    }
    setPendingById((p) => ({ ...p, [productId]: false }))
  }

  const handleTogglePopular = async (productId: string) => {
    const target = products.find((item) => item.id === productId)
    if (!target) return
    const ok = await persistProduct({ ...target, is_popular: !target.is_popular })
    if (ok) toast.success('인기 설정이 변경되었습니다.')
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    initialSnapshotRef.current = JSON.stringify(product)
    setIsDialogOpen(true)
    setCollapsedGroupIds(new Set())
  }

  const handleCreate = () => {
    const now = new Date().toISOString()
    const newProduct = {
      id: '',
      slug: '',
      name_ko: '',
      desc_ko: '',
      category: 'jarred' as const,
      base_price_vnd: 0,
      image_url: '',
      images: [] as Product['images'],
      option_groups: [] as Product['option_groups'],
      is_available: true,
      is_popular: false,
      sort_order: products.length + 1,
      created_at: now,
    }
    setEditingProduct(newProduct)
    initialSnapshotRef.current = JSON.stringify(newProduct)
    setIsDialogOpen(true)
    setCollapsedGroupIds(new Set())
  }

  const handleSave = async () => {
    if (!editingProduct) return

    if (!editingProduct.name_ko.trim() || editingProduct.base_price_vnd <= 0) {
      toast.error('이름과 가격을 확인해주세요.')
      return
    }

    const next = {
      ...editingProduct,
      slug:
        editingProduct.slug.trim() ||
        editingProduct.name_ko
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-'),
    }

    const ok = await persistProduct(next)
    if (!ok) return

    initialSnapshotRef.current = null
    setIsDialogOpen(false)
    setEditingProduct(null)
    toast.success('메뉴가 저장되었습니다.')
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const token = await getAccessToken()
      const response = await fetch('/api/admin/products/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      })
      let result: unknown
      try {
        result = await response.json()
      } catch {
        result = null
      }
      if (!response.ok) {
        toast.error(getApiError(result, '삭제에 실패했습니다.'))
        return
      }

      await loadProducts()
      toast.success('메뉴가 삭제되었습니다.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.')
    }
  }

  const addOptionGroup = () => {
    setEditingProduct((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        option_groups: [
          ...prev.option_groups,
          {
            id: `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            product_id: prev.id || 'new',
            name_ko: '새 옵션 그룹',
            required: false,
            single_select: true,
            min_select: 0,
            max_select: 1,
            display_order: prev.option_groups.length,
            option_values: [],
          },
        ],
      }
    })
  }

  const addOptionValue = (groupId: string) => {
    setEditingProduct((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        option_groups: prev.option_groups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                option_values: [
                  ...group.option_values,
                  {
                    id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    option_group_id: group.id,
                    name_ko: '새 옵션',
                    display_order: group.option_values.length,
                    is_available: true,
                    is_sold_out: false,
                    price_rule: {
                      apply_price_delta: false,
                      price_delta_vnd: 0,
                    },
                  },
                ],
              }
            : group
        ),
      }
    })
  }

  const moveOptionGroupUp = (groupIdx: number) => {
    if (groupIdx <= 0) return
    setEditingProduct((prev) => {
      if (!prev) return prev
      const arr = [...prev.option_groups]
      ;[arr[groupIdx - 1], arr[groupIdx]] = [arr[groupIdx], arr[groupIdx - 1]]
      const next = arr.map((g, i) => ({ ...g, display_order: i }))
      return { ...prev, option_groups: next }
    })
  }

  const moveOptionGroupDown = (groupIdx: number) => {
    const len = editingProduct?.option_groups.length ?? 0
    if (groupIdx >= len - 1) return
    setEditingProduct((prev) => {
      if (!prev) return prev
      const arr = [...prev.option_groups]
      ;[arr[groupIdx], arr[groupIdx + 1]] = [arr[groupIdx + 1], arr[groupIdx]]
      const next = arr.map((g, i) => ({ ...g, display_order: i }))
      return { ...prev, option_groups: next }
    })
  }

  const moveOptionValueUp = (groupIdx: number, optIdx: number) => {
    if (optIdx <= 0) return
    setEditingProduct((prev) => {
      if (!prev) return prev
      const groups = prev.option_groups.map((g, gi) => {
        if (gi !== groupIdx) return g
        const arr = [...g.option_values]
        ;[arr[optIdx - 1], arr[optIdx]] = [arr[optIdx], arr[optIdx - 1]]
        const next = arr.map((o, i) => ({ ...o, display_order: i }))
        return { ...g, option_values: next }
      })
      return { ...prev, option_groups: groups }
    })
  }

  const moveOptionValueDown = (groupIdx: number, optIdx: number) => {
    const vals = editingProduct?.option_groups[groupIdx]?.option_values ?? []
    if (optIdx >= vals.length - 1) return
    setEditingProduct((prev) => {
      if (!prev) return prev
      const groups = prev.option_groups.map((g, gi) => {
        if (gi !== groupIdx) return g
        const arr = [...g.option_values]
        ;[arr[optIdx], arr[optIdx + 1]] = [arr[optIdx + 1], arr[optIdx]]
        const next = arr.map((o, i) => ({ ...o, display_order: i }))
        return { ...g, option_values: next }
      })
      return { ...prev, option_groups: groups }
    })
  }

  const toggleGroupCollapsed = (groupId: string) => {
    setCollapsedGroupIds((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const duplicateOptionGroup = (groupIdx: number) => {
    const group = editingProduct?.option_groups[groupIdx]
    if (!group || !editingProduct) return
    const newGroupId = `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const newValues = group.option_values.map((ov, i) => ({
      ...ov,
      id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}`,
      option_group_id: newGroupId,
      name_ko: `${ov.name_ko} 복사본`,
      display_order: group.option_values.length + i,
    }))
    const newGroup = {
      ...group,
      id: newGroupId,
      product_id: editingProduct.id || 'new',
      name_ko: `${group.name_ko} 복사본`,
      display_order: editingProduct.option_groups.length,
      option_values: newValues,
    }
    setEditingProduct((prev) =>
      prev ? { ...prev, option_groups: [...prev.option_groups, newGroup] } : prev
    )
    toast.success('옵션 그룹이 복제되었습니다.')
  }

  const duplicateOptionValue = (groupIdx: number, optIdx: number) => {
    const group = editingProduct?.option_groups[groupIdx]
    const opt = group?.option_values[optIdx]
    if (!group || !opt || !editingProduct) return
    const newOpt = {
      ...opt,
      id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      option_group_id: group.id,
      name_ko: `${opt.name_ko} 복사본`,
      display_order: group.option_values.length,
    }
    setEditingProduct((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        option_groups: prev.option_groups.map((g, gi) =>
          gi === groupIdx
            ? { ...g, option_values: [...g.option_values, newOpt] }
            : g
        ),
      }
    })
    toast.success('옵션이 복제되었습니다.')
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      const dirty =
        initialSnapshotRef.current != null &&
        editingProduct != null &&
        JSON.stringify(editingProduct) !== initialSnapshotRef.current
      if (dirty && !confirm('저장하지 않은 변경사항이 있습니다. 닫으시겠습니까?')) return
      initialSnapshotRef.current = null
      setEditingProduct(null)
    }
    setIsDialogOpen(open)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">메뉴 관리</h1>
          <p className="text-sm text-muted-foreground">상품을 추가하고 관리합니다</p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">※ 대표 이미지와 옵션이 저장됩니다.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          메뉴 추가
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="메뉴 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ProductCategory | 'all')}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{sortedProducts.length}개의 메뉴</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">상품 목록을 불러오는 중...</div>
          ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>메뉴</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead className="text-right">가격</TableHead>
                  <TableHead className="text-center">판매중</TableHead>
                  <TableHead className="text-center">인기</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.map((product) => (
                  <TableRow key={product.id} className={!product.is_available ? 'opacity-50' : ''}>
                    <TableCell>
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                          {(() => {
                            const src = product.images?.[0]?.url || product.image_url
                            return hasValidImageSrc(src) ? (
                              <Image src={src} alt={product.name_ko} fill className="object-cover" sizes="48px" />
                            ) : (
                              <span className="text-[10px] text-muted-foreground">이미지 없음</span>
                            )
                          })()}
                        </div>
                        <div>
                          <p className="font-medium">{product.name_ko}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{product.desc_ko}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{CATEGORY_LABELS[product.category]}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatVND(product.base_price_vnd)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={product.is_available}
                        onCheckedChange={() => handleToggleAvailable(product.id)}
                        disabled={Boolean(pendingById[product.id])}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleTogglePopular(product.id)}
                        className={`p-1.5 rounded-lg transition-colors ${product.is_popular ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                      >
                        <Flame className="w-4 h-4" />
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog - Enhanced with multi-image & options */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? '메뉴 수정' : '메뉴 추가'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold text-sm">기본 정보</h3>
              <div>
                <Label>메뉴 이름 *</Label>
                <Input
                  value={editingProduct?.name_ko || ''}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, name_ko: e.target.value } : null)}
                  placeholder="간장게장"
                />
              </div>
              <div>
                <Label>설명</Label>
                <Textarea
                  value={editingProduct?.desc_ko || ''}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, desc_ko: e.target.value } : null)}
                  placeholder="메뉴 설명..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>카테고리 *</Label>
                  <Select
                    value={editingProduct?.category || 'jarred'}
                    onValueChange={(v) => setEditingProduct(prev => prev ? { ...prev, category: v as ProductCategory } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>가격 (VND) *</Label>
                  <Input
                    type="number"
                    value={editingProduct?.base_price_vnd || 0}
                    onChange={(e) => setEditingProduct(prev => prev ? { ...prev, base_price_vnd: parseInt(e.target.value) || 0 } : null)}
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold text-sm">이미지 관리</h3>
              <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/50">
                <div className="relative w-20 h-20 rounded overflow-hidden bg-muted mx-auto mb-2 flex items-center justify-center">
                  {(() => {
                    const src = editingProduct?.images?.[0]?.url || editingProduct?.image_url
                    return hasValidImageSrc(src) ? (
                      <Image src={src} alt="대표" fill className="object-cover" sizes="80px" />
                    ) : (
                      <span className="text-xs text-muted-foreground">이미지 없음</span>
                    )
                  })()}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file || !editingProduct) return
                    setIsUploadingImage(true)
                    try {
                      const token = await getAccessToken()
                      const formData = new FormData()
                      formData.set('file', file)
                      formData.set('productId', editingProduct.id || 'temp')
                      const res = await fetch('/api/admin/uploads/product-image', {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData,
                      })
                      let data: { error?: string; publicUrl?: string }
                      try {
                        data = (await res.json()) as { error?: string; publicUrl?: string }
                      } catch {
                        data = {}
                      }
                      if (!res.ok) {
                        toast.error(getApiError(data, '이미지 업로드에 실패했습니다.'))
                        return
                      }
                      const publicUrl = data.publicUrl
                      if (publicUrl) {
                        setEditingProduct((prev) =>
                          prev
                            ? {
                                ...prev,
                                image_url: publicUrl,
                                images: [{ id: 'uploaded', product_id: prev.id || '', url: publicUrl, alt_text: prev.name_ko || '상품 이미지', is_featured: true, display_order: 0, uploaded_at: new Date().toISOString() }],
                              }
                            : null
                        )
                        toast.success('이미지가 적용되었습니다. 저장 버튼을 눌러 반영하세요.')
                      }
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : '이미지 업로드 중 오류가 발생했습니다.')
                    } finally {
                      setIsUploadingImage(false)
                      e.target.value = ''
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingImage}
                  onClick={() => imageInputRef.current?.click()}
                >
                  {isUploadingImage ? '업로드 중...' : '이미지 선택'}
                </Button>
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold text-sm">상품 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">중량 (g)</Label>
                  <Input
                    type="number"
                    value={editingProduct?.weight_g || 0}
                    onChange={(e) => setEditingProduct(prev => prev ? { ...prev, weight_g: parseInt(e.target.value) || undefined } : null)}
                  />
                </div>
                <div>
                  <Label className="text-xs">유통기한 (일)</Label>
                  <Input
                    type="number"
                    value={editingProduct?.shelf_life_days || 0}
                    onChange={(e) => setEditingProduct(prev => prev ? { ...prev, shelf_life_days: parseInt(e.target.value) || undefined } : null)}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">보관 방법</Label>
                <Input
                  value={editingProduct?.storage_instructions || ''}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, storage_instructions: e.target.value } : null)}
                  placeholder="냉장 2-4℃ 보관"
                />
              </div>
              <div>
                <Label className="text-xs">알러지 (쉼표로 구분)</Label>
                <Input
                  value={editingProduct?.allergens?.join(', ') || ''}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, allergens: e.target.value.split(',').map(a => a.trim()) } : null)}
                  placeholder="crustacean, soy"
                />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">옵션 그룹 ({editingProduct?.option_groups.length || 0}개)</h3>
                <Button type="button" variant="outline" size="sm" onClick={addOptionGroup}>
                  옵션 그룹 추가
                </Button>
              </div>
              <input
                ref={optionImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  const target = optionUploadTargetRef.current
                  if (!file || !editingProduct || target === null) {
                    e.target.value = ''
                    return
                  }
                  const { groupIdx: gi, optIdx: oi } = target
                  setUploadingOptionKey(`${gi}-${oi}`)
                  try {
                    const token = await getAccessToken()
                    const formData = new FormData()
                    formData.set('file', file)
                    formData.set('productId', editingProduct.id || 'temp')
                    const res = await fetch('/api/admin/uploads/product-image', {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` },
                      body: formData,
                    })
                    let data: { error?: string; publicUrl?: string }
                    try {
                      data = (await res.json()) as { error?: string; publicUrl?: string }
                    } catch {
                      data = {}
                    }
                    if (!res.ok) {
                      toast.error(getApiError(data, '이미지 업로드에 실패했습니다.'))
                      return
                    }
                    const publicUrl = data.publicUrl
                    if (publicUrl) {
                      setEditingProduct((prev) =>
                        prev
                          ? {
                              ...prev,
                              option_groups: prev.option_groups.map((item, idx) =>
                                idx === gi
                                  ? {
                                      ...item,
                                      option_values: item.option_values.map((option, valueIdx) =>
                                        valueIdx === oi ? { ...option, image_url: publicUrl } : option
                                      ),
                                    }
                                  : item
                              ),
                            }
                          : null
                      )
                      toast.success('옵션 이미지가 적용되었습니다. 저장 버튼을 눌러 반영하세요.')
                    }
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : '이미지 업로드 중 오류가 발생했습니다.')
                  } finally {
                    setUploadingOptionKey(null)
                    optionUploadTargetRef.current = null
                    e.target.value = ''
                  }
                }}
              />
              {editingProduct?.option_groups.map((group, groupIdx) => {
                const isCollapsed = collapsedGroupIds.has(group.id)
                return (
                <div key={group.id} className="border rounded-lg overflow-hidden">
                  {/* Group header - always visible */}
                  <div className="flex items-center gap-2 p-3 bg-muted/40">
                    <button
                      type="button"
                      onClick={() => toggleGroupCollapsed(group.id)}
                      className="shrink-0 p-0.5 hover:bg-muted rounded"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <div className="flex flex-col shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveOptionGroupUp(groupIdx)}
                        disabled={groupIdx === 0}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveOptionGroupDown(groupIdx)}
                        disabled={groupIdx === (editingProduct?.option_groups.length ?? 1) - 1}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </div>
                    {isCollapsed ? (
                      <div className="flex-1 flex items-center gap-2 text-sm">
                        <span className="font-medium truncate">{group.name_ko || '옵션 그룹'}</span>
                        {group.required && <span className="text-destructive text-xs">필수</span>}
                        <span className="text-xs text-muted-foreground">옵션 {group.option_values.length}개</span>
                      </div>
                    ) : (
                      <Input
                        className="flex-1"
                        value={group.name_ko}
                        onChange={(e) =>
                          setEditingProduct((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  option_groups: prev.option_groups.map((item, idx) =>
                                    idx === groupIdx ? { ...item, name_ko: e.target.value } : item
                                  ),
                                }
                              : null
                          )
                        }
                      />
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      {!isCollapsed && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => duplicateOptionGroup(groupIdx)}
                        >
                          <Copy className="w-3 h-3 mr-0.5" />
                          복제
                        </Button>
                      )}
                      <button
                        onClick={() =>
                          setEditingProduct((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  option_groups: prev.option_groups.filter((_, i) => i !== groupIdx),
                                }
                              : null
                          )
                        }
                        className="text-xs text-destructive px-2 py-1 hover:bg-destructive/10 rounded"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  {!isCollapsed && (
                  <div className="p-3 space-y-3 border-t">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <label className="flex items-center justify-between gap-2 border rounded-md p-2">
                      필수
                      <Switch
                        checked={group.required}
                        onCheckedChange={(checked) =>
                          setEditingProduct((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  option_groups: prev.option_groups.map((item, idx) =>
                                    idx === groupIdx
                                      ? {
                                          ...item,
                                          required: checked,
                                          min_select: checked ? Math.max(item.min_select, 1) : item.min_select,
                                        }
                                      : item
                                  ),
                                }
                              : null
                          )
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between gap-2 border rounded-md p-2">
                      단일 선택
                      <Switch
                        checked={group.single_select}
                        onCheckedChange={(checked) =>
                          setEditingProduct((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  option_groups: prev.option_groups.map((item, idx) =>
                                    idx === groupIdx
                                      ? {
                                          ...item,
                                          single_select: checked,
                                          max_select: checked ? 1 : Math.max(item.max_select, 2),
                                        }
                                      : item
                                  ),
                                }
                              : null
                          )
                        }
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">최소 선택</Label>
                      <Input
                        type="number"
                        value={group.min_select}
                        onChange={(e) =>
                          setEditingProduct((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  option_groups: prev.option_groups.map((item, idx) =>
                                    idx === groupIdx ? { ...item, min_select: parseInt(e.target.value, 10) || 0 } : item
                                  ),
                                }
                              : null
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">최대 선택</Label>
                      <Input
                        type="number"
                        value={group.max_select}
                        onChange={(e) =>
                          setEditingProduct((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  option_groups: prev.option_groups.map((item, idx) =>
                                    idx === groupIdx ? { ...item, max_select: parseInt(e.target.value, 10) || 1 } : item
                                  ),
                                }
                              : null
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <p><strong>옵션값 ({group.option_values.length}개)</strong></p>
                      <Button type="button" variant="outline" size="sm" onClick={() => addOptionValue(group.id)}>
                        옵션값 추가
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {group.option_values.map((opt, optIdx) => (
                        <div key={opt.id} className="flex items-start gap-2">
                          <div className="flex flex-col shrink-0 pt-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveOptionValueUp(groupIdx, optIdx)}
                              disabled={optIdx === 0}
                            >
                              <ChevronUp className="w-3 h-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveOptionValueDown(groupIdx, optIdx)}
                              disabled={optIdx === group.option_values.length - 1}
                            >
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex-1 border rounded-md p-2 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={opt.name_ko}
                              onChange={(e) =>
                                setEditingProduct((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        option_groups: prev.option_groups.map((item, idx) =>
                                          idx === groupIdx
                                            ? {
                                                ...item,
                                                option_values: item.option_values.map((option, valueIdx) =>
                                                  valueIdx === optIdx ? { ...option, name_ko: e.target.value } : option
                                                ),
                                              }
                                            : item
                                        ),
                                      }
                                    : null
                                )
                              }
                            />
                            <Input
                              type="number"
                              value={opt.price_rule.price_delta_vnd}
                              onChange={(e) => {
                                const price = parseInt(e.target.value, 10) || 0
                                setEditingProduct((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        option_groups: prev.option_groups.map((item, idx) =>
                                          idx === groupIdx
                                            ? {
                                                ...item,
                                                option_values: item.option_values.map((option, valueIdx) =>
                                                  valueIdx === optIdx
                                                    ? {
                                                        ...option,
                                                        price_rule: {
                                                          apply_price_delta: price > 0,
                                                          price_delta_vnd: price,
                                                        },
                                                      }
                                                    : option
                                                ),
                                              }
                                            : item
                                        ),
                                      }
                                    : null
                                )
                              }}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">옵션 이미지</Label>
                            <div className="flex items-center gap-2 mt-0.5">
                              {hasValidImageSrc(opt.image_url) && (
                                <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                                  <Image src={opt.image_url!} alt={opt.name_ko} fill sizes="40px" className="object-cover" />
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  disabled={uploadingOptionKey === `${groupIdx}-${optIdx}`}
                                  onClick={() => {
                                    optionUploadTargetRef.current = { groupIdx, optIdx }
                                    optionImageInputRef.current?.click()
                                  }}
                                >
                                  {uploadingOptionKey === `${groupIdx}-${optIdx}` ? '업로드 중...' : '이미지 업로드'}
                                </Button>
                                {hasValidImageSrc(opt.image_url) && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-destructive hover:text-destructive"
                                    onClick={() =>
                                      setEditingProduct((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              option_groups: prev.option_groups.map((item, idx) =>
                                                idx === groupIdx
                                                  ? {
                                                      ...item,
                                                      option_values: item.option_values.map((option, valueIdx) =>
                                                        valueIdx === optIdx ? { ...option, image_url: undefined } : option
                                                      ),
                                                    }
                                                  : item
                                              ),
                                            }
                                          : null
                                      )
                                    }
                                  >
                                    이미지 제거
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <label className="flex items-center gap-2">
                              <Switch
                                checked={opt.is_available && !opt.is_sold_out}
                                onCheckedChange={(checked) =>
                                  setEditingProduct((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          option_groups: prev.option_groups.map((item, idx) =>
                                            idx === groupIdx
                                              ? {
                                                  ...item,
                                                  option_values: item.option_values.map((option, valueIdx) =>
                                                    valueIdx === optIdx
                                                      ? {
                                                          ...option,
                                                          is_available: checked,
                                                          is_sold_out: !checked,
                                                        }
                                                      : option
                                                  ),
                                                }
                                              : item
                                          ),
                                        }
                                      : null
                                  )
                                }
                              />
                              판매 가능
                            </label>
                            <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs px-1"
                              onClick={() => duplicateOptionValue(groupIdx, optIdx)}
                            >
                              <Copy className="w-3 h-3 mr-0.5" />
                              복제
                            </Button>
                            <button
                              onClick={() =>
                                setEditingProduct((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        option_groups: prev.option_groups.map((item, idx) =>
                                          idx === groupIdx
                                            ? {
                                                ...item,
                                                option_values: item.option_values.filter((_, valueIdx) => valueIdx !== optIdx),
                                              }
                                            : item
                                        ),
                                      }
                                    : null
                                )
                              }
                              className="text-destructive text-xs px-2 py-1 hover:bg-destructive/10 rounded"
                            >
                              삭제
                            </button>
                            </div>
                          </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  </div>
                  )}
                </div>
              )})}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <p className="text-xs text-muted-foreground sm:mr-auto self-start">기본 정보, 대표 이미지, 옵션이 저장됩니다</p>
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>취소</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? '저장 중...' : '저장'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
