'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCart } from '@/lib/cart-context'
import type { CartItemOption, Product } from '@/lib/types'
import { toast } from 'sonner'
import { fetchProductsFromSupabase } from '@/lib/products/queries'

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
}

const hasValidImageSrc = (url: unknown): url is string =>
  typeof url === 'string' && url.trim().length > 0

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | string[]>>({})
  const [specialRequest, setSpecialRequest] = useState('')
  const [mainImageIndex, setMainImageIndex] = useState(0)
  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    async function loadProduct() {
      setIsLoading(true)
      try {
        const products = await fetchProductsFromSupabase()
        const found = products.find((item) => item.slug === String(params.slug))
        setProduct(found ?? null)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '상품 정보를 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [params.slug])

  // Get displayable images
  const displayImages = product?.images && product.images.length > 0 
    ? product.images 
    : product?.image_url 
      ? [{ id: 'default', product_id: product.id, url: product.image_url, alt_text: product.name_ko, is_featured: true, display_order: 0, uploaded_at: new Date().toISOString() }]
      : []

  // Initialize required options
  useEffect(() => {
    if (!product) return
    const initial: Record<string, string | string[]> = {}
    product.option_groups.forEach(group => {
      if (group.required && group.single_select) {
        initial[group.id] = group.option_values[0]?.id || ''
      } else if (!group.single_select) {
        initial[group.id] = []
      }
    })
    setSelectedOptions(initial)
  }, [product])

  useEffect(() => {
    setMainImageIndex(0)
  }, [product?.id])

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">메뉴를 불러오는 중입니다...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">메뉴를 찾을 수 없습니다.</p>
        <Link href="/shop">
          <Button variant="outline">메뉴 목록으로</Button>
        </Link>
      </div>
    )
  }

  // Calculate total price with new price_rule structure
  const optionsTotal = (() => {
    let total = 0
    product.option_groups.forEach(group => {
      const selected = selectedOptions[group.id]
      if (Array.isArray(selected)) {
        selected.forEach(optId => {
          const opt = group.option_values.find(o => o.id === optId)
          if (opt && opt.price_rule.apply_price_delta) total += opt.price_rule.price_delta_vnd
        })
      } else if (selected) {
        const opt = group.option_values.find(o => o.id === selected)
        if (opt && opt.price_rule.apply_price_delta) total += opt.price_rule.price_delta_vnd
      }
    })
    return total
  })()

  const unitPrice = product.base_price_vnd + optionsTotal
  const totalPrice = unitPrice * quantity

  const handleOptionChange = (groupId: string, optionId: string, isMulti: boolean) => {
    setSelectedOptions(prev => {
      if (isMulti) {
        const current = (prev[groupId] as string[]) || []
        const group = product.option_groups.find(g => g.id === groupId)
        const option = group?.option_values.find(o => o.id === optionId)
        
        if (!option?.is_available) {
          toast.error('선택 불가능한 옵션입니다')
          return prev
        }
        
        if (current.includes(optionId)) {
          return { ...prev, [groupId]: current.filter(id => id !== optionId) }
        } else if (group && current.length < group.max_select) {
          return { ...prev, [groupId]: [...current, optionId] }
        } else {
          toast.error(`최대 ${group?.max_select}개까지 선택 가능합니다`)
          return prev
        }
      } else {
        const group = product.option_groups.find(g => g.id === groupId)
        const option = group?.option_values.find(o => o.id === optionId)
        if (!option?.is_available) {
          toast.error('선택 불가능한 옵션입니다')
          return prev
        }
        return { ...prev, [groupId]: optionId }
      }
    })
  }

  const handleAddToCart = () => {
    // Validate required options
    const errors: string[] = []
    product.option_groups.forEach(group => {
      if (group.required) {
        const selected = selectedOptions[group.id]
        if (!selected || (Array.isArray(selected) && selected.length === 0)) {
          errors.push(`${group.name_ko}을(를) 선택해주세요`)
        }
      }
    })

    if (errors.length > 0) {
      setValidationError(errors.join('\n'))
      return
    }

    setValidationError('')

    // Convert selected options to CartItemOption[]
    const cartOptions: CartItemOption[] = []
    product.option_groups.forEach(group => {
      const selected = selectedOptions[group.id]
      if (Array.isArray(selected)) {
        selected.forEach(optId => {
          const opt = group.option_values.find(o => o.id === optId)
          if (opt) {
            cartOptions.push({
              group_id: group.id,
              group_name: group.name_ko,
              option_id: opt.id,
              option_name: opt.name_ko,
              price_delta_vnd: opt.price_rule.apply_price_delta ? opt.price_rule.price_delta_vnd : 0,
            })
          }
        })
      } else if (selected) {
        const opt = group.option_values.find(o => o.id === selected)
        if (opt) {
          cartOptions.push({
            group_id: group.id,
            group_name: group.name_ko,
            option_id: opt.id,
            option_name: opt.name_ko,
            price_delta_vnd: opt.price_rule.apply_price_delta ? opt.price_rule.price_delta_vnd : 0,
          })
        }
      }
    })

    addItem(product, quantity, cartOptions, specialRequest || undefined)
    toast.success('장바구니에 추가되었습니다', {
      action: {
        label: '장바구니 보기',
        onClick: () => router.push('/cart'),
      },
    })
  }

  const isCategoryJarred = product.category === 'jarred'

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Back link */}
      <Link
        href="/shop"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        메뉴 목록
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            {(() => {
              const src = displayImages[mainImageIndex]?.url || product.image_url
              return hasValidImageSrc(src) ? (
                <Image
                  src={src}
                  alt={displayImages[mainImageIndex]?.alt_text || product.name_ko}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <span className="text-sm text-muted-foreground">이미지 없음</span>
              )
            })()}
          </div>

          {/* Thumbnail Strip */}
          {displayImages.length > 1 && (
            <div className="flex gap-2">
              {displayImages.length > 4 && mainImageIndex > 0 && (
                <button
                  onClick={() => setMainImageIndex(Math.max(0, mainImageIndex - 1))}
                  className="flex-shrink-0 p-2 hover:bg-muted rounded"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <div className="flex gap-2 overflow-x-auto">
                {displayImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setMainImageIndex(idx)}
                    className={`relative w-16 h-16 flex-shrink-0 rounded border-2 transition-colors overflow-hidden ${
                      mainImageIndex === idx ? 'border-primary' : 'border-muted'
                    }`}
                  >
                    {hasValidImageSrc(img.url) ? (
                      <Image
                        src={img.url}
                        alt={img.alt_text}
                        fill
                        sizes="64px"
                        className="object-cover rounded"
                      />
                    ) : (
                      <span className="text-[10px] text-muted-foreground p-1 text-center">없음</span>
                    )}
                  </button>
                ))}
              </div>
              {displayImages.length > 4 && mainImageIndex < displayImages.length - 1 && (
                <button
                  onClick={() => setMainImageIndex(Math.min(displayImages.length - 1, mainImageIndex + 1))}
                  className="flex-shrink-0 p-2 hover:bg-muted rounded"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Product Info & Options */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.badges?.map(badge => (
                <Badge key={badge} variant="secondary" className="text-xs">
                  {badge === 'popular' && '인기'}
                  {badge === 'beginner_friendly' && '입문자 추천'}
                  {badge === 'gift_recommended' && '선물 추천'}
                  {badge === 'local_delivery' && '근거리 배송'}
                  {badge === 'cold_shipping' && '저온 배송'}
                </Badge>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{product.name_ko}</h1>
            <p className="text-muted-foreground text-sm mb-4">{product.desc_ko}</p>
          </div>

          {/* Price */}
          <div className={`p-4 rounded-lg ${isCategoryJarred ? 'bg-primary/5' : 'bg-secondary/5'}`}>
            <p className="text-sm text-muted-foreground">기본 가격</p>
            <p className="text-3xl font-bold text-primary mb-3">{formatVND(product.base_price_vnd)}</p>
            {optionsTotal > 0 && (
              <div className="text-sm space-y-1">
                <p>옵션: +{formatVND(optionsTotal)}</p>
                <p className="font-semibold">합계: {formatVND(unitPrice)}</p>
              </div>
            )}
          </div>

          {/* Options */}
          {product.option_groups.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              {product.option_groups.map(group => (
                <div key={group.id}>
                  <label className="text-sm font-medium flex items-center gap-1 mb-3">
                    {group.name_ko}
                    {group.required && <span className="text-destructive">*</span>}
                  </label>

                  {group.single_select ? (
                    <RadioGroup
                      value={selectedOptions[group.id] as string || ''}
                      onValueChange={(value) => handleOptionChange(group.id, value, false)}
                    >
                      <div className="grid gap-2">
                        {group.option_values.map(opt => (
                          <label
                            key={opt.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              !opt.is_available ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'
                            } ${selectedOptions[group.id] === opt.id ? 'border-primary bg-primary/5' : 'border-muted'}`}
                          >
                            <RadioGroupItem value={opt.id} disabled={!opt.is_available} />
                            <span className="text-sm flex-1">{opt.name_ko}</span>
                            {opt.price_rule.apply_price_delta && opt.price_rule.price_delta_vnd > 0 && (
                              <span className="text-xs text-muted-foreground">+{formatVND(opt.price_rule.price_delta_vnd)}</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </RadioGroup>
                  ) : (
                    <div className="grid gap-2">
                      {group.option_values.map(opt => (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            !opt.is_available ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'
                          } ${(selectedOptions[group.id] as string[])?.includes(opt.id) ? 'border-primary bg-primary/5' : 'border-muted'}`}
                        >
                          <Checkbox
                            checked={(selectedOptions[group.id] as string[])?.includes(opt.id) || false}
                            onCheckedChange={() => handleOptionChange(group.id, opt.id, true)}
                            disabled={!opt.is_available}
                          />
                          <span className="text-sm flex-1">{opt.name_ko}</span>
                          {opt.price_rule.apply_price_delta && opt.price_rule.price_delta_vnd > 0 && (
                            <span className="text-xs text-muted-foreground">+{formatVND(opt.price_rule.price_delta_vnd)}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Product Info */}
          <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
            {product.weight_g && <p><strong>용량:</strong> {product.weight_g}g</p>}
            {product.shelf_life_days && <p><strong>유통기한:</strong> {product.shelf_life_days}일</p>}
            {product.storage_instructions && <p><strong>보관:</strong> {product.storage_instructions}</p>}
            {product.allergens && product.allergens.length > 0 && (
              <p><strong>알러지:</strong> {product.allergens.join(', ')}</p>
            )}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium">수량</Label>
            <div className="flex items-center border rounded-lg w-fit">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="px-4">{quantity}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <Label className="text-sm font-medium mb-2 block">특별한 요청 (선택사항)</Label>
            <Textarea
              value={specialRequest}
              onChange={(e) => setSpecialRequest(e.target.value)}
              placeholder="예: 덜 맵게, 추가 배송 정보 등"
              className="min-h-[80px]"
            />
          </div>

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* Total & Action */}
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">총액:</span>
              <span className="text-2xl font-bold text-primary">{formatVND(totalPrice)}</span>
            </div>
            <Button onClick={handleAddToCart} className="w-full h-12">
              <ShoppingCart className="w-4 h-4 mr-2" />
              장바구니 담기
            </Button>
            <Button variant="outline" className="w-full h-12">
              바로 주문
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
