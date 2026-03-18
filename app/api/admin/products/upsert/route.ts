import { NextResponse } from 'next/server'
import type { Product } from '@/lib/types'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { assertAdminPermissionByAccessToken } from '@/lib/auth/admin-role'

type UpsertProductBody = {
  product?: Product
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/** category → product_type (text 컬럼, UI category 기준) */
function toProductType(category: string): string {
  const m: Record<string, string> = { jarred: 'jarred', poke: 'poke', sets: 'set', sides: 'addon', beverages: 'beverage' }
  return m[category] ?? 'jarred'
}

export async function POST(request: Request) {
  const authResult = await assertAdminPermissionByAccessToken(
    request.headers.get('authorization'),
    'products.edit'
  )
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: 403 })
  }

  try {
    const body = (await request.json()) as UpsertProductBody
    const product = body.product
    if (!product) {
      console.error('[products-upsert] 400: product missing', { hasProduct: !!body.product })
      return NextResponse.json({ error: '상품 데이터가 필요합니다. (body.product)' }, { status: 400 })
    }

    const isNew = !product.id || String(product.id).trim() === ''
    const productId = isNew ? crypto.randomUUID() : String(product.id).trim()

    const rawSlug = (product.slug || slugify(product.name_ko || '')).slice(0, 120).trim()
    const safeSlug = rawSlug || `product-${productId.slice(0, 8)}`

    const category = typeof product.category === 'string' ? product.category : 'jarred'
    const product_type = toProductType(category)
    const titleKo = typeof product.name_ko === 'string' ? product.name_ko.trim() || '상품' : '상품'
    const priceVnd = Math.max(0, Math.floor(Number(product.base_price_vnd) || 0))
    const isActive = Boolean(product.is_available ?? true)

    const imageUrl = typeof product.image_url === 'string' && product.image_url.trim() ? product.image_url.trim() : null
    const payload = {
      slug: safeSlug,
      category,
      product_type,
      title: { ko: titleKo },
      price_vnd: priceVnd,
      is_active: isActive,
      image_url: imageUrl,
    }

    const admin = getSupabaseAdminClient()
    let productError: { message?: string; code?: string } | null = null

    if (isNew) {
      const { error } = await admin.from('products').insert({ ...payload, id: productId })
      productError = error
    } else {
      const { error } = await admin.from('products').update(payload).eq('id', productId)
      productError = error
    }

    if (productError) {
      const err = productError as { message?: string; code?: string; details?: string; hint?: string }
      const code = err.code ?? ''
      let userMsg = err.message ?? '상품 저장에 실패했습니다.'
      if (code === '23505' && (err.message?.includes('slug') || err.message?.includes('products_slug_key'))) {
        userMsg = '이미 사용 중인 URL(slug)입니다. 다른 이름이나 URL을 사용해주세요.'
      } else if (code === '23502') {
        userMsg = `필수 항목이 비어 있습니다. ${err.message ?? ''}`.trim()
      } else if (err.message?.includes('column') && err.message?.includes('does not exist')) {
        userMsg = `DB 컬럼 오류: ${err.message} (마이그레이션 필요할 수 있음)`
      }
      console.error('[products-upsert] 400: DB error', { code, message: err.message, details: err.details })
      return NextResponse.json(
        { error: userMsg, code, details: err.details, hint: err.hint },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, productId })
  } catch (error) {
    const message = error instanceof Error ? error.message : '상품 저장 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
