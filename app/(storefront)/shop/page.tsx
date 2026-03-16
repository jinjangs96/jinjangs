'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/storefront/product-card'
import type { Product, ProductCategory } from '@/lib/types'
import { fetchProductsFromSupabase } from '@/lib/products/queries'
import { toast } from 'sonner'

const CATEGORIES: { value: ProductCategory | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'jarred', label: '장요리' },
  { value: 'poke', label: '포케' },
  { value: 'sets', label: '세트/선물' },
  { value: 'sides', label: '곁들임' },
  { value: 'beverages', label: '음료' },
]

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ProductCategory | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const initialCategory = new URLSearchParams(window.location.search).get('category')
    if (
      initialCategory === 'jarred' ||
      initialCategory === 'poke' ||
      initialCategory === 'sets' ||
      initialCategory === 'sides' ||
      initialCategory === 'beverages'
    ) {
      setCategory(initialCategory)
    }
  }, [])

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true)
      try {
        const data = await fetchProductsFromSupabase()
        setProducts(data)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '상품 정보를 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        if (category !== 'all' && p.category !== category) return false
        if (search) {
          const searchLower = search.toLowerCase()
          return p.name_ko.toLowerCase().includes(searchLower) ||
                 p.desc_ko.toLowerCase().includes(searchLower)
        }
        return true
      })
      .sort((a, b) => a.sort_order - b.sort_order)
  }, [products, search, category])

  const availableProducts = filteredProducts.filter(p => p.is_available)
  const unavailableProducts = filteredProducts.filter(p => !p.is_available)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">메뉴</h1>
        <p className="text-muted-foreground mt-1">정통 한식의 다양한 메뉴를 만나보세요</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="메뉴 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          className="sm:hidden"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          필터
        </Button>
      </div>

      {/* Category Tabs (Desktop) */}
      <div className="hidden sm:flex gap-2 mb-8 flex-wrap">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            variant={category === cat.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategory(cat.value)}
            className={category === cat.value ? 'bg-primary text-primary-foreground' : ''}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Category Tabs (Mobile - collapsible) */}
      {showFilters && (
        <div className="sm:hidden flex gap-2 mb-6 flex-wrap pb-4 border-b border-border">
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat.value}
              variant={category === cat.value ? 'default' : 'outline'}
              className={`cursor-pointer ${category === cat.value ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-6">
        {filteredProducts.length}개의 메뉴
        {category !== 'all' && ` (${CATEGORIES.find(c => c.value === category)?.label})`}
        {search && ` - "${search}" 검색 결과`}
      </p>

      {/* Products Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>메뉴를 불러오는 중입니다...</p>
        </div>
      ) : availableProducts.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {availableProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p>검색 결과가 없습니다.</p>
        </div>
      )}

      {/* Unavailable Products */}
      {unavailableProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-muted-foreground mb-4">품절 메뉴</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 opacity-60">
            {unavailableProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
