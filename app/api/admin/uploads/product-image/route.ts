import { NextResponse } from 'next/server'
import { assertAdminPermissionByAccessToken } from '@/lib/auth/admin-role'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function POST(request: Request) {
  const authResult = await assertAdminPermissionByAccessToken(
    request.headers.get('authorization'),
    'products.edit'
  )
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const productId = String(formData.get('productId') ?? 'temp')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '업로드할 파일이 필요합니다.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'JPG, PNG, WEBP 형식만 업로드할 수 있습니다.' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filePath = `products/${productId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`
    const bucket = process.env.SUPABASE_PRODUCT_IMAGES_BUCKET || 'product-images'

    const fileBuffer = await file.arrayBuffer()
    const admin = getSupabaseAdminClient()

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(filePath, fileBuffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 })
    }

    const { data: publicData } = admin.storage.from(bucket).getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      path: filePath,
      publicUrl: publicData.publicUrl,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
