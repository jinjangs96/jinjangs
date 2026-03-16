'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, CreditCard, Banknote, Wallet, Check, Loader2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { useCart } from '@/lib/cart-context'
import { toast } from 'sonner'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
}

const hasValidImageSrc = (url: unknown): url is string =>
  typeof url === 'string' && url.trim().length > 0

type CheckoutPaymentMethod = 'bank_transfer' | 'qr_transfer' | 'cod' | 'megapay'
type BankAccount = { id: string; bank_name: string; account_name: string; account_number: string; qr_image_url?: string | null; is_active: boolean }
type AddressRow = {
  id: string
  label: 'home' | 'office' | 'other'
  recipient_name: string
  recipient_phone: string
  district: string
  ward: string | null
  address_line1: string
  address_line2: string | null
  delivery_note: string | null
  is_default: boolean
}

const DELIVERY_SLOTS = [
  { id: 'slot-1', label: '오늘 12:00-13:00', available: true },
  { id: 'slot-2', label: '오늘 13:00-14:00', available: true },
  { id: 'slot-3', label: '오늘 14:00-15:00', available: true },
  { id: 'slot-4', label: '오늘 15:00-16:00', available: false },
  { id: 'slot-5', label: '내일 12:00-13:00', available: true },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, subtotal, clearCart } = useCart()
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [savedAddresses, setSavedAddresses] = useState<AddressRow[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('none')
  const [saveAddress, setSaveAddress] = useState(false)
  const [isDifferentRecipient, setIsDifferentRecipient] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    recipient_name: '',
    recipient_phone: '',
    address: '',
    district: '',
    ward: '',
    delivery_slot: '',
    payment_method: 'bank_transfer' as CheckoutPaymentMethod,
    special_requests: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadCheckoutMetadata() {
      const supabase = getSupabaseBrowserClient()

      const { data: bankRows, error: bankErr } = await supabase
        .from('bank_accounts')
        .select('id,bank_name,account_name,account_number,qr_image_url,is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      setBankAccounts(bankErr ? [] : ((bankRows ?? []) as BankAccount[]))

      if (user) {
        const { data: addresses, error: addrErr } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (addrErr) {
          setSavedAddresses([])
        } else {
          const list = (addresses ?? []) as AddressRow[]
          setSavedAddresses(list)
          const defaultAddress = list.find((item) => item.is_default) ?? list[0]
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id)
            setForm((prev) => ({
              ...prev,
              district: defaultAddress.district || prev.district,
              ward: defaultAddress.ward ?? prev.ward,
              address: [defaultAddress.address_line1, defaultAddress.address_line2].filter(Boolean).join(' '),
            }))
          }
        }
      }
    }

    loadCheckoutMetadata()
  }, [user])

  const activeBankAccounts = useMemo(() => bankAccounts.filter((item) => item.is_active), [bankAccounts])

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">장바구니가 비어있습니다.</p>
        <Link href="/shop">
          <Button>메뉴 보러 가기</Button>
        </Link>
      </div>
    )
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.customer_name.trim()) newErrors.customer_name = '이름을 입력해주세요'
    if (!form.customer_phone.trim()) newErrors.customer_phone = '전화번호를 입력해주세요'
    if (!form.address.trim()) newErrors.address = '주소를 입력해주세요'
    if (!form.delivery_slot) newErrors.delivery_slot = '배달 시간을 선택해주세요'
    if (isDifferentRecipient && !form.recipient_name.trim()) newErrors.recipient_name = '수령인 이름을 입력해주세요'
    if (isDifferentRecipient && !form.recipient_phone.trim()) newErrors.recipient_phone = '수령인 전화번호를 입력해주세요'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)

    try {
      const slotLabel = DELIVERY_SLOTS.find((slot) => slot.id === form.delivery_slot)?.label || form.delivery_slot
      const fullDeliveryNote = [form.special_requests.trim(), `[희망 수령 시간] ${slotLabel}`]
        .filter(Boolean)
        .join('\n')

      const body = {
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        recipient_name: isDifferentRecipient ? form.recipient_name.trim() : undefined,
        recipient_phone: isDifferentRecipient ? form.recipient_phone.trim() : undefined,
        district: form.district || '미정',
        ward: form.ward || null,
        address_line1: form.address.trim(),
        address_line2: null,
        delivery_note: fullDeliveryNote || null,
        payment_method: form.payment_method,
        subtotal_vnd: subtotal,
        delivery_fee_vnd: 0,
        total_vnd: subtotal,
        source_channel: 'website' as const,
        save_address: Boolean(user && saveAddress && selectedAddressId === 'none'),
        address_label: 'home' as const,
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          base_price_vnd: item.base_price_vnd,
          quantity: item.quantity,
          selected_options: item.selected_options.map((option) => ({
            group_name: option.group_name,
            option_name: option.option_name,
            price_delta_vnd: option.price_delta_vnd,
          })),
        })),
      }

      const supabase = getSupabaseBrowserClient()
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token ?? ''

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })

      const result = (await response.json()) as {
        error?: string
        order?: {
          id: string
          order_number: string
          tracking_code: string
          is_guest?: boolean
        }
      }

      if (!response.ok || !result.order) {
        toast.error(result.error || '주문 처리에 실패했습니다.')
        return
      }

      clearCart()
      toast.success('주문이 완료되었습니다!')
      const q = new URLSearchParams({
        order_number: result.order.order_number,
        tracking_code: result.order.tracking_code,
        order_id: result.order.id,
        ...(result.order.is_guest ? { is_guest: 'true' } : {}),
      })
      router.push(`/order-complete?${q.toString()}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '주문 처리 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/cart"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        장바구니로 돌아가기
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">주문하기</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">배달 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">이름 *</Label>
                    <Input
                      id="name"
                      value={form.customer_name}
                      onChange={(e) => updateForm('customer_name', e.target.value)}
                      placeholder="홍길동"
                      className={errors.customer_name ? 'border-destructive' : ''}
                    />
                    {errors.customer_name && (
                      <p className="text-xs text-destructive mt-1">{errors.customer_name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">전화번호 *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.customer_phone}
                      onChange={(e) => updateForm('customer_phone', e.target.value)}
                      placeholder="090-1234-5678"
                      className={errors.customer_phone ? 'border-destructive' : ''}
                    />
                    {errors.customer_phone && (
                      <p className="text-xs text-destructive mt-1">{errors.customer_phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">배달 주소 *</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => updateForm('address', e.target.value)}
                    placeholder="123 Nguyen Hue, Apartment 101"
                    className={errors.address ? 'border-destructive' : ''}
                  />
                  {errors.address && (
                    <p className="text-xs text-destructive mt-1">{errors.address}</p>
                  )}
                </div>

                {user && (
                  <div className="space-y-2">
                    <Label>저장된 주소</Label>
                    <Select
                      value={selectedAddressId}
                      onValueChange={(value) => {
                        setSelectedAddressId(value)
                        if (value === 'none') return
                        const selected = savedAddresses.find((item) => item.id === value)
                        if (!selected) return
                        setForm((prev) => ({
                          ...prev,
                          district: selected.district,
                          ward: selected.ward || '',
                          address: [selected.address_line1, selected.address_line2].filter(Boolean).join(' '),
                        }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="저장된 주소 선택(선택 사항)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">직접 입력</SelectItem>
                        {savedAddresses.map((address) => (
                          <SelectItem key={address.id} value={address.id}>
                            {address.label} - {address.address_line1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Checkbox
                        checked={saveAddress}
                        onCheckedChange={(checked) => setSaveAddress(Boolean(checked))}
                        disabled={selectedAddressId !== 'none'}
                      />
                      새 주소를 내 계정에 저장
                    </label>
                  </div>
                )}

                <div className="space-y-3 rounded-xl border p-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={isDifferentRecipient}
                      onCheckedChange={(checked) => setIsDifferentRecipient(Boolean(checked))}
                    />
                    수령인 정보가 주문자와 다름
                  </label>

                  {isDifferentRecipient && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="recipient_name">수령인 이름 *</Label>
                        <Input
                          id="recipient_name"
                          value={form.recipient_name}
                          onChange={(e) => updateForm('recipient_name', e.target.value)}
                          className={errors.recipient_name ? 'border-destructive' : ''}
                        />
                        {errors.recipient_name && <p className="text-xs text-destructive mt-1">{errors.recipient_name}</p>}
                      </div>
                      <div>
                        <Label htmlFor="recipient_phone">수령인 전화번호 *</Label>
                        <Input
                          id="recipient_phone"
                          value={form.recipient_phone}
                          onChange={(e) => updateForm('recipient_phone', e.target.value)}
                          className={errors.recipient_phone ? 'border-destructive' : ''}
                        />
                        {errors.recipient_phone && <p className="text-xs text-destructive mt-1">{errors.recipient_phone}</p>}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label>배달 시간 *</Label>
                  <RadioGroup
                    value={form.delivery_slot}
                    onValueChange={(v) => updateForm('delivery_slot', v)}
                    className="grid grid-cols-2 gap-2 mt-2"
                  >
                    {DELIVERY_SLOTS.map(slot => (
                      <label
                        key={slot.id}
                        className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors
                          ${!slot.available ? 'opacity-50 cursor-not-allowed' : ''}
                          ${form.delivery_slot === slot.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                          ${errors.delivery_slot && !form.delivery_slot ? 'border-destructive' : ''}
                        `}
                      >
                        <RadioGroupItem value={slot.id} disabled={!slot.available} />
                        <span className="text-sm">{slot.label}</span>
                        {!slot.available && <span className="text-xs text-muted-foreground">(마감)</span>}
                      </label>
                    ))}
                  </RadioGroup>
                  {errors.delivery_slot && (
                    <p className="text-xs text-destructive mt-1">{errors.delivery_slot}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="special">요청 사항</Label>
                  <Textarea
                    id="special"
                    value={form.special_requests}
                    onChange={(e) => updateForm('special_requests', e.target.value)}
                    placeholder="배달 요청사항이 있으면 입력해주세요"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">결제 방법</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={form.payment_method}
                  onValueChange={(v) => setForm(prev => ({ ...prev, payment_method: v as CheckoutPaymentMethod }))}
                  className="space-y-3"
                >
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${form.payment_method === 'bank_transfer' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <RadioGroupItem value="bank_transfer" />
                    <CreditCard className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">계좌이체</p>
                      <p className="text-xs text-muted-foreground">은행 계좌로 송금</p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${form.payment_method === 'qr_transfer' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <RadioGroupItem value="qr_transfer" />
                    <Wallet className="w-5 h-5 text-ok" />
                    <div className="flex-1">
                      <p className="font-medium">QR 송금</p>
                      <p className="text-xs text-muted-foreground">QR 코드로 이체</p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${form.payment_method === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <RadioGroupItem value="cod" />
                    <Banknote className="w-5 h-5 text-ok" />
                    <div className="flex-1">
                      <p className="font-medium">현금 결제 (COD)</p>
                      <p className="text-xs text-muted-foreground">배달 시 현금으로 결제</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 rounded-xl border border-border opacity-50 cursor-not-allowed">
                    <RadioGroupItem value="megapay" disabled />
                    <Wallet className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">MegaPay</p>
                      <p className="text-xs text-muted-foreground">출시 예정</p>
                    </div>
                  </label>
                </RadioGroup>

                {/* Bank Account Details */}
                {(form.payment_method === 'bank_transfer' || form.payment_method === 'qr_transfer') && activeBankAccounts.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-muted/50">
                    <p className="text-sm font-medium mb-3">송금 계좌 정보</p>
                    <div className="space-y-3">
                      {activeBankAccounts.map(account => (
                        <div key={account.id} className="flex items-center gap-3 p-3 bg-card rounded-lg">
                          {account.qr_image_url && (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white">
                              <Image
                                src={account.qr_image_url}
                                alt="QR Code"
                                fill
                                className="object-contain"
                              />
                            </div>
                          )}
                          <div className="text-sm">
                            <p className="font-medium">{account.bank_name}</p>
                            <p className="text-muted-foreground">{account.account_number}</p>
                            <p className="text-muted-foreground">{account.account_name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      * 주문번호를 입금자명에 기재해주세요. 입금 확인 후 조리가 시작됩니다.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4" />
                  <p className="font-medium text-foreground">비회원 주문 안내</p>
                </div>
                <p>로그인 없이도 주문 가능합니다. 주문 완료 후 받은 주문번호/전화번호로 추적할 수 있습니다.</p>
                <p className="mt-2">배송비는 Grab 기준으로 별도 안내됩니다.</p>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="font-bold text-lg mb-4">주문 내역</h2>

                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                        {hasValidImageSrc(item.product_image) ? (
                          <Image src={item.product_image} alt={item.product_name} fill sizes="48px" className="object-cover" />
                        ) : (
                          <span className="text-[10px] text-muted-foreground">없음</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">상품 금액</span>
                    <span>{formatVND(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">배송비</span>
                    <span className="text-muted-foreground text-xs">Grab 기준 별도 안내</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between font-bold text-lg">
                  <span>상품 결제 금액</span>
                  <span className="text-primary">{formatVND(subtotal)}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-6 bg-primary hover:bg-primary/90"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      주문 처리 중...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      주문 완료하기
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
