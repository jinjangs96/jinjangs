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
      console.error('[product-image-upload] 400: file missing or not File', {
        hasFile: !!file,
        formKeys: Array.from(formData.keys()),
      })
      return NextResponse.json({ error: '이미지 파일이 없습니다. (FormData key: file)' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      console.warn('[product-image-upload] 400: disallowed type', {
        name: file.name,
        type: file.type,
        size: file.size,
      })
      return NextResponse.json({ error: 'JPG, PNG, WEBP만 업로드할 수 있습니다.' }, { status: 400 })
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
      console.error('[product-image-upload] 400: storage upload failed', {
        bucket,
        path: filePath,
        name: file.name,
        size: file.size,
        message: uploadError.message,
      })
      const userMsg =
        uploadError.message?.includes('Bucket') || uploadError.message?.includes('bucket')
          ? `저장소 버킷을 사용할 수 없습니다. (${bucket}) Supabase 대시보드에서 버킷 생성 및 정책을 확인하세요.`
          : `저장소 업로드 실패: ${uploadError.message}`
      return NextResponse.json({ error: userMsg }, { status: 400 })
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
