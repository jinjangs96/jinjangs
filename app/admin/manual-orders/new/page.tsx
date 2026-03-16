'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type ManualItem = {
  product_name: string
  quantity: number
  unit_price_vnd: number
}

export default function AdminManualOrderNewPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [district, setDistrict] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'qr_transfer' | 'cod'>('cod')
  const [items, setItems] = useState<ManualItem[]>([{ product_name: '', quantity: 1, unit_price_vnd: 0 }])

  const addRow = () => setItems((prev) => [...prev, { product_name: '', quantity: 1, unit_price_vnd: 0 }])
  const removeRow = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async () => {
    const normalizedItems = items.filter((item) => item.product_name.trim() && item.quantity > 0 && item.unit_price_vnd > 0)
    if (!customerName.trim() || !customerPhone.trim() || !district.trim() || !addressLine1.trim() || normalizedItems.length === 0) {
      toast.error('필수 정보를 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token ?? ''

      const response = await fetch('/api/admin/manual-orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          district,
          address_line1: addressLine1,
          payment_method: paymentMethod,
          items: normalizedItems,
        }),
      })

      const result = (await response.json()) as { error?: string; order?: { order_number: string } }
      if (!response.ok) {
        toast.error(result.error || '수동 주문 생성에 실패했습니다.')
        return
      }

      toast.success(`수동 주문 생성 완료: ${result.order?.order_number ?? ''}`)
      router.push('/admin/orders')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '수동 주문 생성 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">수동 주문 등록</h1>
        <p className="text-sm text-muted-foreground">전화/오프라인 주문을 ERP에 직접 등록합니다.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>고객 정보</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div><Label>고객명</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
          <div><Label>전화번호</Label><Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} /></div>
          <div><Label>지역</Label><Input value={district} onChange={(e) => setDistrict(e.target.value)} /></div>
          <div><Label>주소</Label><Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} /></div>
          <div className="sm:col-span-2">
            <Label>결제수단</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'bank_transfer' | 'qr_transfer' | 'cod')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cod">현장결제(COD)</SelectItem>
                <SelectItem value="bank_transfer">계좌이체</SelectItem>
                <SelectItem value="qr_transfer">QR 송금</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>주문 상품</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-6"><Label>상품명</Label><Input value={item.product_name} onChange={(e) => setItems((prev) => prev.map((row, i) => i === index ? { ...row, product_name: e.target.value } : row))} /></div>
              <div className="col-span-2"><Label>수량</Label><Input type="number" min={1} value={item.quantity} onChange={(e) => setItems((prev) => prev.map((row, i) => i === index ? { ...row, quantity: Number(e.target.value) || 1 } : row))} /></div>
              <div className="col-span-3"><Label>단가</Label><Input type="number" min={0} value={item.unit_price_vnd} onChange={(e) => setItems((prev) => prev.map((row, i) => i === index ? { ...row, unit_price_vnd: Number(e.target.value) || 0 } : row))} /></div>
              <div className="col-span-1"><Button variant="outline" onClick={() => removeRow(index)}>삭제</Button></div>
            </div>
          ))}
          <Button variant="outline" onClick={addRow}>상품 행 추가</Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : '수동 주문 저장'}
        </Button>
      </div>
    </div>
  )
}
