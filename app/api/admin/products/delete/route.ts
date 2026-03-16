import { NextResponse } from 'next/server'
import { assertAdminPermissionByAccessToken } from '@/lib/auth/admin-role'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

type DeleteBody = {
  productId?: string
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
    const body = (await request.json()) as DeleteBody
    const productId = body.productId?.trim()

    if (!productId) {
      return NextResponse.json({ error: 'productId가 필요합니다.' }, { status: 400 })
    }

    const admin = getSupabaseAdminClient()
    const { error: productDeleteError } = await admin.from('products').delete().eq('id', productId)
    if (productDeleteError) {
      return NextResponse.json({ error: productDeleteError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '상품 삭제 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
