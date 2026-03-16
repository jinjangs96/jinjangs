'use client'

import type { Product, ProductCategory, ProductImage, ProductOptionGroup, ProductOptionValue } from '@/lib/types'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

type ProductRow = Record<string, unknown>
type ProductImageRow = Record<string, unknown>
type ProductOptionGroupRow = Record<string, unknown>
type ProductOptionValueRow = Record<string, unknown>

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function num(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function bool(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

/** jsonb 필드에서 ko 키 추출 (title, name, label 등) */
function jsonbKo(obj: unknown): string {
  if (obj == null) return ''
  if (typeof obj === 'string') return obj
  if (typeof obj === 'object' && obj !== null && 'ko' in obj) {
    const v = (obj as Record<string, unknown>).ko
    return typeof v === 'string' ? v : ''
  }
  return ''
}

function mapCategory(raw: unknown): ProductCategory {
  const value = text(raw).toLowerCase()
  if (value === 'jarred' || value === 'poke' || value === 'sets' || value === 'sides' || value === 'beverages') {
    return value
  }
  return 'jarred'
}

function mapProductImage(row: ProductImageRow): ProductImage {
  return {
    id: text(row.id),
    product_id: text(row.product_id),
    url: text(row.url ?? row.image_url),
    alt_text: text(row.alt_text, '상품 이미지'),
    is_featured: bool(row.is_featured ?? row.is_primary, false),
    display_order: num(row.display_order ?? row.sort_order, 0),
    uploaded_at: text(row.uploaded_at ?? row.created_at, new Date().toISOString()),
  }
}

function mapProductOptionValue(row: ProductOptionValueRow): ProductOptionValue {
  const priceDelta = num(row.price_delta_vnd ?? row.price_delta ?? row.extra_price_vnd, 0)
  const soldOut = bool(row.is_sold_out, false) || bool(row.sold_out, false)
  const applyDelta = typeof row.price_delta_enabled === 'boolean' ? row.price_delta_enabled : priceDelta > 0
  const available = typeof row.is_available === 'boolean' ? row.is_available && !soldOut : !soldOut
  const groupId = text(row.option_group_id ?? row.group_id)
  const nameVal = text(row.name_ko ?? row.name) || jsonbKo(row.label)

  return {
    id: text(row.id),
    option_group_id: groupId,
    name_ko: nameVal || '옵션',
    description_ko: text(row.description_ko ?? (typeof row.description === 'string' ? row.description : null)) || jsonbKo(row.description),
    display_order: num(row.display_order ?? row.sort_order, 0),
    is_available: available,
    is_sold_out: soldOut,
    price_rule: {
      apply_price_delta: applyDelta,
      price_delta_vnd: priceDelta,
    },
    image_url: text(row.image_url, ''),
  }
}

function mapProductOptionGroup(
  row: ProductOptionGroupRow,
  optionValuesByGroup: Map<string, ProductOptionValue[]>
): ProductOptionGroup {
  const id = text(row.id)
  const required = bool(row.required ?? row.is_required, false)
  const singleSelect = typeof row.single_select === 'boolean' ? row.single_select : row.selection_type === 'multiple' ? false : true
  return {
    id,
    product_id: text(row.product_id),
    name_ko: text(row.name_ko ?? row.name) || jsonbKo(row.name) || '옵션 그룹',
    required,
    single_select: singleSelect,
    min_select: num(row.min_select, required ? 1 : 0),
    max_select: num(row.max_select, singleSelect ? 1 : 99),
    display_order: num(row.display_order ?? row.sort_order, 0),
    option_values: (optionValuesByGroup.get(id) ?? []).sort((a, b) => a.display_order - b.display_order),
  }
}

function mapProduct(
  row: ProductRow,
  imagesByProduct: Map<string, ProductImage[]>,
  optionGroupsByProduct: Map<string, ProductOptionGroup[]>
): Product {
  const id = text(row.id)
  const images = (imagesByProduct.get(id) ?? []).sort((a, b) => a.display_order - b.display_order)
  const imageUrl = images[0]?.url || text(row.image_url ?? row.thumbnail_url, '')

  const storageRaw = row.storage_instructions
  const storageStr = typeof storageRaw === 'string' ? storageRaw : jsonbKo(storageRaw)
  return {
    id,
    slug: text(row.slug),
    name_ko: text(row.name_ko ?? row.name) || jsonbKo(row.title) || '상품',
    desc_ko: text(row.desc_ko ?? row.description_ko ?? row.description) || jsonbKo(row.short_description) || jsonbKo(row.long_description) || '',
    category: mapCategory(row.category),
    base_price_vnd: num(row.base_price_vnd ?? row.price_vnd ?? row.price, 0),
    image_url: imageUrl,
    images,
    option_groups: (optionGroupsByProduct.get(id) ?? []).sort((a, b) => a.display_order - b.display_order),
    storage_instructions: storageStr,
    allergens: Array.isArray(row.allergens) ? (row.allergens as string[]) : [],
    weight_g: num(row.weight_g, 0) || undefined,
    shelf_life_days: num(row.shelf_life_days, 0) || undefined,
    badges: Array.isArray(row.badges) ? (row.badges as Product['badges']) : [],
    is_available: bool(row.is_available ?? row.is_active, true),
    is_popular: bool(row.is_popular ?? row.is_featured, false),
    sort_order: num(row.sort_order, 0),
    created_at: text(row.created_at, new Date().toISOString()),
  }
}

export async function fetchProductsFromSupabase() {
  const supabase = getSupabaseBrowserClient()

  const { data: products, error: productError } = await supabase.from('products').select('*')

  if (productError) throw productError

  const imagesByProduct = new Map<string, ProductImage[]>()
  const optionGroupsByProduct = new Map<string, ProductOptionGroup[]>()

  return (products ?? [])
    .map((row) => mapProduct(row, imagesByProduct, optionGroupsByProduct))
    .sort((a, b) => a.sort_order - b.sort_order)
}
