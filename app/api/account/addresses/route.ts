import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/require-user'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

type AddressLabel = 'home' | 'office' | 'other'

type AddressPayload = {
  id?: string
  label?: AddressLabel
  recipient_name?: string
  recipient_phone?: string
  district?: string
  ward?: string | null
  address_line1?: string
  address_line2?: string | null
  delivery_note?: string | null
  is_default?: boolean
}

function normalizeLabel(value: unknown): AddressLabel {
  return value === 'office' || value === 'other' ? value : 'home'
}

async function enforceSingleDefaultAddress(userId: string, preferredId?: string) {
  const admin = getSupabaseAdminClient()
  const { data: rows, error: readError } = await admin
    .from('addresses')
    .select('id,is_default,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (readError) {
    console.error('[account/addresses] enforce read error', readError)
    return
  }

  const list = rows ?? []
  if (list.length === 0) return

  const pickedId =
    (preferredId && list.some((row) => String(row.id) === preferredId) && preferredId) ||
    String(list.find((row) => Boolean(row.is_default))?.id ?? list[0].id)

  const { error: resetError } = await admin
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', userId)
  if (resetError) {
    console.error('[account/addresses] enforce reset error', resetError)
    return
  }

  const { error: applyError } = await admin
    .from('addresses')
    .update({ is_default: true })
    .eq('id', pickedId)
    .eq('user_id', userId)
  if (applyError) {
    console.error('[account/addresses] enforce apply error', applyError)
  }
}

export async function GET(request: Request) {
  const auth = await requireUser(request)
  if (!auth.ok) return auth.response

  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from('addresses')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[account/addresses] GET error', error)
    return NextResponse.json({ ok: false, error: '주소 목록을 불러오지 못했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, addresses: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireUser(request)
  if (!auth.ok) return auth.response

  let payload: AddressPayload
  try {
    payload = (await request.json()) as AddressPayload
  } catch {
    return NextResponse.json({ ok: false, error: '요청 형식이 올바르지 않습니다.' }, { status: 400 })
  }

  const recipientName = String(payload.recipient_name ?? '').trim()
  const recipientPhone = String(payload.recipient_phone ?? '').trim()
  const district = String(payload.district ?? '').trim()
  const addressLine1 = String(payload.address_line1 ?? '').trim()
  if (!recipientName || !recipientPhone || !district || !addressLine1) {
    return NextResponse.json({ ok: false, error: '필수 입력값이 부족합니다.' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()
  const isDefault = Boolean(payload.is_default)

  if (isDefault) {
    const { error: resetError } = await admin
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', auth.user.id)
    if (resetError) {
      console.error('[account/addresses] POST reset default error', resetError)
    }
  }

  const { data, error } = await admin
    .from('addresses')
    .insert({
      user_id: auth.user.id,
      label: normalizeLabel(payload.label),
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      district,
      ward: payload.ward ? String(payload.ward).trim() : null,
      address_line1: addressLine1,
      address_line2: payload.address_line2 ? String(payload.address_line2).trim() : null,
      delivery_note: payload.delivery_note ? String(payload.delivery_note).trim() : null,
      is_default: isDefault,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[account/addresses] POST error', error)
    return NextResponse.json({ ok: false, error: '주소 저장에 실패했습니다.' }, { status: 500 })
  }

  await enforceSingleDefaultAddress(auth.user.id, isDefault ? String(data.id) : undefined)

  return NextResponse.json({ ok: true, address: data })
}

export async function PATCH(request: Request) {
  const auth = await requireUser(request)
  if (!auth.ok) return auth.response

  let payload: AddressPayload
  try {
    payload = (await request.json()) as AddressPayload
  } catch {
    return NextResponse.json({ ok: false, error: '요청 형식이 올바르지 않습니다.' }, { status: 400 })
  }

  const addressId = String(payload.id ?? '').trim()
  if (!addressId) {
    return NextResponse.json({ ok: false, error: '주소 ID가 필요합니다.' }, { status: 400 })
  }

  const recipientName = String(payload.recipient_name ?? '').trim()
  const recipientPhone = String(payload.recipient_phone ?? '').trim()
  const district = String(payload.district ?? '').trim()
  const addressLine1 = String(payload.address_line1 ?? '').trim()
  if (!recipientName || !recipientPhone || !district || !addressLine1) {
    return NextResponse.json({ ok: false, error: '필수 입력값이 부족합니다.' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()
  const isDefault = Boolean(payload.is_default)
  if (isDefault) {
    const { error: resetError } = await admin
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', auth.user.id)
    if (resetError) {
      console.error('[account/addresses] PATCH reset default error', resetError)
    }
  }

  const { data, error } = await admin
    .from('addresses')
    .update({
      label: normalizeLabel(payload.label),
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      district,
      ward: payload.ward ? String(payload.ward).trim() : null,
      address_line1: addressLine1,
      address_line2: payload.address_line2 ? String(payload.address_line2).trim() : null,
      delivery_note: payload.delivery_note ? String(payload.delivery_note).trim() : null,
      is_default: isDefault,
    })
    .eq('id', addressId)
    .eq('user_id', auth.user.id)
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('[account/addresses] PATCH error', error)
    return NextResponse.json({ ok: false, error: '주소 수정에 실패했습니다.' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ ok: false, error: '수정할 주소를 찾을 수 없습니다.' }, { status: 404 })
  }

  await enforceSingleDefaultAddress(auth.user.id, isDefault ? String(data.id) : undefined)

  return NextResponse.json({ ok: true, address: data })
}

export async function DELETE(request: Request) {
  const auth = await requireUser(request)
  if (!auth.ok) return auth.response

  let payload: { id?: string }
  try {
    payload = (await request.json()) as { id?: string }
  } catch {
    return NextResponse.json({ ok: false, error: '요청 형식이 올바르지 않습니다.' }, { status: 400 })
  }

  const addressId = String(payload.id ?? '').trim()
  if (!addressId) {
    return NextResponse.json({ ok: false, error: '주소 ID가 필요합니다.' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()
  const { error } = await admin
    .from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', auth.user.id)

  if (error) {
    console.error('[account/addresses] DELETE error', error)
    return NextResponse.json({ ok: false, error: '주소 삭제에 실패했습니다.' }, { status: 500 })
  }

  await enforceSingleDefaultAddress(auth.user.id)

  return NextResponse.json({ ok: true })
}
