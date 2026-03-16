'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function OrderCompletePage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [trackingCode, setTrackingCode] = useState('')
  const [orderId, setOrderId] = useState('')
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setOrderNumber(params.get('order_number') || '')
    setTrackingCode(params.get('tracking_code') || '')
    setOrderId(params.get('order_id') || '')
    setIsGuest(params.get('is_guest') === 'true')
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Card>
        <CardHeader className="text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto text-ok mb-2" />
          <CardTitle>주문이 접수되었습니다</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p>주문번호: <strong>{orderNumber || '-'}</strong></p>
            <p>배송조회 코드: <strong>{trackingCode || '-'}</strong></p>
          </div>
          <p className="text-muted-foreground">
            계좌이체/QR 송금은 입금 확인 후 조리가 시작됩니다. 비회원도 주문번호와 전화번호로 배송 조회가 가능합니다.
          </p>
          <p className="text-muted-foreground">
            배송비는 Grab 실비 기준으로 별도 안내됩니다.
          </p>
          <div className={`grid gap-2 ${isGuest ? '' : 'sm:grid-cols-2'}`}>
            {!isGuest && (
              <Link href={orderId ? `/account/orders/${orderId}` : '/account/orders'}>
                <Button className="w-full">주문 상세 보기</Button>
              </Link>
            )}
            <Link href="/track-order">
              <Button variant={isGuest ? 'default' : 'outline'} className="w-full">배송 조회하기</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
