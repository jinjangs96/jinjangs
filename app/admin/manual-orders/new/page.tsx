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
import { useAdminLocale } from '@/lib/admin-locale-context'
import { ADMIN_MANUAL_ORDER_LABELS, ADMIN_COMMON_LABELS, getAdminLabel } from '@/lib/admin-i18n'

type ManualItem = {
  product_name: string
  quantity: number
  unit_price_vnd: number
}

export default function AdminManualOrderNewPage() {
  const router = useRouter()
  const { locale } = useAdminLocale()
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
      toast.error(getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'required_error'))
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
        toast.error(result.error || getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'create_failed'))
        return
      }

      toast.success(`${getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'create_success')}: ${result.order?.order_number ?? ''}`)
      router.push('/admin/orders')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'create_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'page_title')}</h1>
        <p className="text-sm text-muted-foreground">{getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'page_subtitle')}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'customer_info')}</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div><Label>{getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'customer_name')}</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
          <div><Label>{getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'phone')}</Label><Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} /></div>
          <div><Label>{getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'district')}</Label><Input value={district} onChange={(e) => setDistrict(e.target.value)} /></div>
          <div><Label>{getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'address')}</Label><Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} /></div>
          <div className="sm:col-span-2">
            <Label>{getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'payment_method')}</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'bank_transfer' | 'qr_transfer' | 'cod')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cod">{getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'payment_cod')}</SelectItem>
                <SelectItem value="bank_transfer">{getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'payment_bank_transfer')}</SelectItem>
                <SelectItem value="qr_transfer">{getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'payment_qr_transfer')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'order_items')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-6"><Label>{getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'product_name')}</Label><Input value={item.product_name} onChange={(e) => setItems((prev) => prev.map((row, i) => i === index ? { ...row, product_name: e.target.value } : row))} /></div>
              <div className="col-span-2"><Label>{getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'quantity')}</Label><Input type="number" min={1} value={item.quantity} onChange={(e) => setItems((prev) => prev.map((row, i) => i === index ? { ...row, quantity: Number(e.target.value) || 1 } : row))} /></div>
              <div className="col-span-3"><Label>{getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'unit_price')}</Label><Input type="number" min={0} value={item.unit_price_vnd} onChange={(e) => setItems((prev) => prev.map((row, i) => i === index ? { ...row, unit_price_vnd: Number(e.target.value) || 0 } : row))} /></div>
              <div className="col-span-1"><Button variant="outline" onClick={() => removeRow(index)}>{getAdminLabel(locale, ADMIN_COMMON_LABELS, 'delete')}</Button></div>
            </div>
          ))}
          <Button variant="outline" onClick={addRow}>{getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'add_row')}</Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? getAdminLabel(locale, ADMIN_COMMON_LABELS, 'saving') : getAdminLabel(locale, ADMIN_MANUAL_ORDER_LABELS, 'submit_btn')}
        </Button>
      </div>
    </div>
  )
}
