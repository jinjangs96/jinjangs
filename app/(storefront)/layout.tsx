import { CartProvider } from '@/lib/cart-context'
import { AuthProvider } from '@/lib/auth-context'
import { Header } from '@/components/storefront/header'
import { Footer } from '@/components/storefront/footer'
import { FloatingIcons } from '@/components/storefront/floating-icons'

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-background">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <FloatingIcons />
        </div>
      </CartProvider>
    </AuthProvider>
  )
}
