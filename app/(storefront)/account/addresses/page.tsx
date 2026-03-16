'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, MapPin, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthGuard } from '@/components/storefront/auth-guard'
import { useAuth } from '@/lib/auth-context'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

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

type AddressForm = {
  label: 'home' | 'office' | 'other'
  recipient_name: string
  recipient_phone: string
  district: string
  ward: string
  address_line1: string
  address_line2: string
  delivery_note: string
  is_default: boolean
}

const EMPTY_FORM: AddressForm = {
  label: 'home',
  recipient_name: '',
  recipient_phone: '',
  district: '',
  ward: '',
  address_line1: '',
  address_line2: '',
  delivery_note: '',
  is_default: false,
}

export default function AccountAddressesPage() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<AddressRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM)
  const isBusy = isSaving || isLoading

  const loadAddresses = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token ?? ''

      const response = await fetch('/api/account/addresses', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
        credentials: 'include',
      })
      const result = (await response.json()) as {
        ok?: boolean
        error?: string
        addresses?: AddressRow[]
      }
      if (!response.ok) {
        toast.error(result.error || '주소 정보를 불러오지 못했습니다.')
        return
      }

      setAddresses(result.addresses ?? [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '주소 정보를 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAddresses().catch(() => {
      setIsLoading(false)
    })
  }, [user])

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const startEdit = (address: AddressRow) => {
    setEditingId(address.id)
    setForm({
      label: address.label,
      recipient_name: address.recipient_name || '',
      recipient_phone: address.recipient_phone || '',
      district: address.district || '',
      ward: address.ward || '',
      address_line1: address.address_line1 || '',
      address_line2: address.address_line2 || '',
      delivery_note: address.delivery_note || '',
      is_default: Boolean(address.is_default),
    })
  }

  const saveAddress = async () => {
    if (!form.recipient_name.trim() || !form.recipient_phone.trim() || !form.district.trim() || !form.address_line1.trim()) {
      toast.error('필수 항목을 모두 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token ?? ''

      const response = await fetch('/api/account/addresses', {
        method: editingId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          label: form.label,
          recipient_name: form.recipient_name,
          recipient_phone: form.recipient_phone,
          district: form.district,
          ward: form.ward || null,
          address_line1: form.address_line1,
          address_line2: form.address_line2 || null,
          delivery_note: form.delivery_note || null,
          is_default: form.is_default,
        }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok) {
        toast.error(result.error || '주소 저장에 실패했습니다.')
        return
      }

      toast.success(editingId ? '주소가 수정되었습니다.' : '주소가 추가되었습니다.')
      resetForm()
      await loadAddresses()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '주소 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteAddress = async (id: string) => {
    if (!confirm('이 주소를 삭제하시겠습니까?')) return
    try {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token ?? ''

      const response = await fetch('/api/account/addresses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ id }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok) {
        toast.error(result.error || '주소 삭제에 실패했습니다.')
        return
      }
      toast.success('주소가 삭제되었습니다.')
      if (editingId === id) resetForm()
      await loadAddresses()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '주소 삭제 중 오류가 발생했습니다.')
    }
  }

  const setAsDefault = async (address: AddressRow) => {
    setIsSaving(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token ?? ''

      const response = await fetch('/api/account/addresses', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          id: address.id,
          label: address.label,
          recipient_name: address.recipient_name,
          recipient_phone: address.recipient_phone,
          district: address.district,
          ward: address.ward,
          address_line1: address.address_line1,
          address_line2: address.address_line2,
          delivery_note: address.delivery_note,
          is_default: true,
        }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok) {
        toast.error(result.error || '기본 주소 설정에 실패했습니다.')
        return
      }
      toast.success('기본 주소로 설정되었습니다.')
      await loadAddresses()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '기본 주소 설정 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          내 계정
        </Link>

        <h1 className="text-2xl font-bold text-foreground mb-6">배송 주소</h1>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">{editingId ? '주소 수정' : '새 주소 추가'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>수령인 이름</Label>
                <Input
                  value={form.recipient_name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, recipient_name: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>수령인 전화번호</Label>
                <Input
                  value={form.recipient_phone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, recipient_phone: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>지역</Label>
                <Input
                  value={form.district}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, district: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>동/읍/면</Label>
                <Input
                  value={form.ward}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, ward: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>주소</Label>
              <Input
                value={form.address_line1}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, address_line1: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>상세 주소</Label>
              <Input
                value={form.address_line2}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, address_line2: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>배송 메모</Label>
              <Textarea
                value={form.delivery_note}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, delivery_note: event.target.value }))
                }
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2 text-sm">
              <input
                id="is_default"
                type="checkbox"
                checked={form.is_default}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, is_default: event.target.checked }))
                }
              />
              <Label htmlFor="is_default">기본 주소로 설정</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveAddress} disabled={isBusy}>
                <Plus className="w-4 h-4 mr-1" />
                {isSaving ? '저장 중...' : editingId ? '수정 저장' : '주소 추가'}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={resetForm} disabled={isBusy}>
                  취소
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">주소를 불러오는 중...</p>
        ) : addresses.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              저장된 주소가 없습니다. 체크아웃 시 입력한 주소를 다음 단계에서 저장할 수 있게 연결합니다.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <Card key={String(address.id)}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {String(address.label ?? '배송지')}
                    {address.is_default && (
                      <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5">
                        기본
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  <p>{address.recipient_name || '-'}</p>
                  <p>{address.recipient_phone || '-'}</p>
                  <p>
                    {[address.address_line1, address.address_line2].filter(Boolean).join(' ')}
                  </p>
                  <p>{[address.district, address.ward].filter(Boolean).join(' / ') || '-'}</p>
                  {address.delivery_note && <p>메모: {address.delivery_note}</p>}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(address)}
                      disabled={isBusy}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      수정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAddress(address.id)}
                      disabled={isBusy}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      삭제
                    </Button>
                    {!address.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAsDefault(address)}
                        disabled={isBusy}
                      >
                        기본 설정
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
