import Link from 'next/link'
import Image from 'next/image'
import { Flame } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Product } from '@/lib/types'

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
}

const hasValidImageSrc = (url: unknown): url is string =>
  typeof url === 'string' && url.trim().length > 0

interface ProductCardProps {
  product: Product
  priority?: boolean
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const displayImage = product.images?.[0]?.url || product.image_url

  return (
    <Link href={`/shop/${product.slug}`}>
      <Card className="group overflow-hidden border-border hover:border-primary/50 transition-colors h-full">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center">
          {hasValidImageSrc(displayImage) ? (
            <Image
              src={displayImage}
              alt={product.name_ko}
              fill
              loading={priority ? 'eager' : 'lazy'}
              priority={priority}
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-xs text-muted-foreground">이미지 없음</span>
          )}
          {!product.is_available && (
            <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
              <span className="text-white font-semibold">품절</span>
            </div>
          )}
          {product.is_popular && product.is_available && (
            <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs">
              <Flame className="w-3 h-3 mr-1" />
              인기
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {product.name_ko}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 h-8">
            {product.desc_ko}
          </p>
          <p className="font-bold text-primary mt-2">
            {formatVND(product.base_price_vnd)}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
