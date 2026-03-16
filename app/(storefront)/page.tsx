'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Flame, ArrowRight, Clock, Truck, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MOCK_HERO_BANNERS, MOCK_PRODUCTS, MOCK_SITE_SETTINGS } from '@/lib/mock-data'
import { usePublicSettings } from '@/lib/use-public-settings'

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
}

export default function HomePage() {
  const activeBanners = MOCK_HERO_BANNERS.filter(b => b.is_active).sort((a, b) => a.sort_order - b.sort_order)
  const popularProducts = MOCK_PRODUCTS.filter(p => p.is_popular && p.is_available).slice(0, 4)
  const { settings: publicSettings } = usePublicSettings()
  const settings = {
    ...MOCK_SITE_SETTINGS,
    site_name_ko: publicSettings.site_name_ko || MOCK_SITE_SETTINGS.site_name_ko,
    tagline_ko: publicSettings.tagline_ko || MOCK_SITE_SETTINGS.tagline_ko,
    min_order_vnd:
      typeof publicSettings.min_order_vnd === 'number' && Number.isFinite(publicSettings.min_order_vnd)
        ? publicSettings.min_order_vnd
        : MOCK_SITE_SETTINGS.min_order_vnd,
  }

  const [currentBanner, setCurrentBanner] = useState(0)

  // Auto-advance banner
  useEffect(() => {
    if (activeBanners.length <= 1) return
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % activeBanners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [activeBanners.length])

  const goToBanner = (index: number) => setCurrentBanner(index)
  const prevBanner = () => setCurrentBanner(prev => (prev - 1 + activeBanners.length) % activeBanners.length)
  const nextBanner = () => setCurrentBanner(prev => (prev + 1) % activeBanners.length)

  return (
    <div>
      {/* Hero Banner Carousel */}
      <section className="w-full bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="relative w-full aspect-[16/6] sm:aspect-[16/5] md:aspect-[16/4.5] overflow-hidden bg-muted">
            {activeBanners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-500 ${index === currentBanner ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                {banner.link_url ? (
                  <Link href={banner.link_url} className="block w-full h-full relative">
                    <Image
                      src={banner.image_url}
                      alt={banner.alt_text}
                      fill
                      className="object-cover object-center"
                      priority={index === 0}
                    />
                  </Link>
                ) : (
                  <div className="w-full h-full relative">
                    <Image
                      src={banner.image_url}
                      alt={banner.alt_text}
                      fill
                      className="object-cover object-center"
                      priority={index === 0}
                    />
                  </div>
                )}
                {/* Overlay with text */}
                <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/30 to-transparent" />
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full px-4 sm:px-6 md:px-8">
                    <div className="max-w-xl">
                      <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 text-balance">
                        {settings.site_name_ko}
                      </h1>
                      <p className="text-white/90 text-sm sm:text-base mb-4 sm:mb-5 line-clamp-2">
                        {settings.tagline_ko}
                      </p>
                      <Link href="/shop">
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                          메뉴 보기
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Nav arrows */}
            {activeBanners.length > 1 && (
              <>
                <button
                  onClick={prevBanner}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
                  aria-label="Previous banner"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextBanner}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
                  aria-label="Next banner"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Dots */}
            {activeBanners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {activeBanners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToBanner(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${index === currentBanner ? 'bg-white' : 'bg-white/40'}`}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-10 bg-secondary/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 bg-card p-5 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">빠른 배달</p>
                <p className="text-sm text-muted-foreground">주문 후 45분 내 도착</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-card p-5 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">무료 배달</p>
                <p className="text-sm text-muted-foreground">{formatVND(settings.free_delivery_threshold_vnd)} 이상 주문시</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-card p-5 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">정통 한식</p>
                <p className="text-sm text-muted-foreground">한국 셰프의 손맛</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Items */}
      <section className="py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">인기 메뉴</h2>
              <p className="text-muted-foreground text-sm mt-1">가장 많이 찾는 메뉴를 만나보세요</p>
            </div>
            <Link href="/shop">
              <Button variant="outline" className="hidden sm:flex">
                전체 메뉴 보기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {popularProducts.map((product, index) => (
              <Link key={product.id} href={`/shop/${product.slug}`}>
                <Card className="group overflow-hidden border-border hover:border-primary/50 transition-colors h-full">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <Image
                      src={product.image_url}
                      alt={product.name_ko}
                      fill
                      loading={index < 4 ? 'eager' : 'lazy'}
                      priority={index < 4}
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.is_popular && (
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
            ))}
          </div>

          <div className="sm:hidden mt-6 text-center">
            <Link href="/shop">
              <Button variant="outline" className="w-full">
                전체 메뉴 보기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-primary">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-3">
            지금 바로 주문하세요
          </h2>
          <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
            맛있는 한식이 문 앞까지 배달됩니다. 최소 주문 금액 {formatVND(settings.min_order_vnd)}
          </p>
          <Link href="/shop">
            <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-white/90">
              메뉴 둘러보기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
