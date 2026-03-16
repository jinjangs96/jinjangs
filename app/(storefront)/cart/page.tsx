'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/lib/cart-context'
import { usePublicSettings } from '@/lib/use-public-settings'

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
}

const hasValidImageSrc = (url: unknown): url is string =>
  typeof url === 'string' && url.trim().length > 0

export default function CartPage() {
  const { items, itemCount, subtotal, deliverySettings, updateQuantity, removeItem } = useCart()
  const { settings: publicSettings } = usePublicSettings()

  const effectiveMinOrder =
    typeof publicSettings.min_order_vnd === 'number' && Number.isFinite(publicSettings.min_order_vnd)
      ? publicSettings.min_order_vnd
      : deliverySettings.min_order_vnd

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">장바구니가 비어있습니다</h1>
        <p className="text-muted-foreground mb-6">맛있는 한식을 담아보세요!</p>
        <Link href="/shop">
          <Button className="bg-primary hover:bg-primary/90">
            메뉴 보러 가기
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">장바구니</h1>
      <p className="text-muted-foreground mb-8">{itemCount}개의 상품</p>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const itemOptionsTotal = item.selected_options.reduce((sum, opt) => sum + opt.price_delta_vnd, 0)
            const itemUnitPrice = item.base_price_vnd + itemOptionsTotal
            const itemTotal = itemUnitPrice * item.quantity

            return (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                      {hasValidImageSrc(item.product_image) ? (
                        <Image
                          src={item.product_image}
                          alt={item.product_name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">이미지 없음</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground">{item.product_name}</h3>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Options */}
                      {item.selected_options.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.selected_options.map(o => o.option_name).join(', ')}
                        </p>
                      )}

                      {/* Special Request */}
                      {item.special_request && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{item.special_request}"
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="font-semibold text-primary">{formatVND(itemTotal)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-4">
            + 더 추가하기
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h2 className="font-bold text-lg mb-4">주문 요약</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">상품 합계</span>
                  <span>{formatVND(subtotal)}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-bold text-lg">
                <span>상품 결제 금액</span>
                <span className="text-primary">{formatVND(subtotal)}</span>
              </div>

              {subtotal < effectiveMinOrder && (
                <p className="text-xs text-destructive mt-3">
                  최소 주문 금액은 {formatVND(effectiveMinOrder)} 입니다.
                </p>
              )}

              <Link href="/checkout">
                <Button
                  className="w-full mt-6 bg-primary hover:bg-primary/90"
                  size="lg"
                  disabled={subtotal < effectiveMinOrder}
                >
                  주문하기
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>

              <p className="text-xs text-muted-foreground text-center mt-3">
                배송비는 Grab 기사 배정 거리 및 시간대에 따라 달라지며, 주문 접수 후 별도로 안내드립니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
