'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, User, Menu, X, ChefHat } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/lib/cart-context'
import { useAuth } from '@/lib/auth-context'
import { LanguageSwitcher, type Language } from './language-switcher'
import { usePublicSettings } from '@/lib/use-public-settings'

const NAV_LINKS = [
  { href: '/', label: '홈' },
  { href: '/shop', label: '메뉴' },
]

export function Header() {
  const pathname = usePathname()
  const { itemCount } = useCart()
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<Language>('ko')
  const { settings } = usePublicSettings()

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-sm leading-tight text-foreground">{settings.site_name_ko}</p>
              <p className="text-xs text-muted-foreground">{settings.tagline_ko}</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                    active
                      ? 'bg-secondary text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Language Switcher - Desktop */}
            <div className="hidden sm:block">
              <LanguageSwitcher currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
            </div>

            <Link href={user ? '/account' : '/login'}>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <User className="w-5 h-5" />
                <span className="sr-only">{user ? '내 계정' : '로그인'}</span>
              </Button>
            </Link>
            
            <Link href="/cart" className="relative">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ShoppingCart className="w-5 h-5" />
                <span className="sr-only">장바구니</span>
              </Button>
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 bg-primary text-primary-foreground text-xs">
                  {itemCount}
                </Badge>
              )}
            </Link>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-border pt-4 mt-2 space-y-1">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'px-4 py-2.5 rounded-xl text-sm font-medium transition-colors block',
                      active
                        ? 'bg-secondary text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    {label}
                  </Link>
                )
              })}
            </div>
            
            {/* Language Switcher - Mobile */}
            <div className="px-4 py-2 border-t border-border/50 mt-2 pt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">언어 선택</p>
              <div className="flex flex-wrap gap-2">
                {['KO', 'VI', 'EN', 'JP', 'ZH'].map((short, idx) => {
                  const codes: Language[] = ['ko', 'vi', 'en', 'ja', 'zh']
                  const lang = codes[idx]
                  return (
                    <Button
                      key={lang}
                      variant={currentLanguage === lang ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setCurrentLanguage(lang)
                        setMobileMenuOpen(false)
                      }}
                      className="text-xs"
                    >
                      {short}
                    </Button>
                  )
                })}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
