'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react'
import type { CartItem, CartItemOption, Product } from './types'

const CART_DELIVERY_FALLBACK = {
  min_order_vnd: 100000,
  delivery_fee_vnd: 25000,
  free_delivery_threshold_vnd: 300000,
}

export type DeliverySettings = typeof CART_DELIVERY_FALLBACK

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  deliveryFee: number
  total: number
  deliverySettings: DeliverySettings
  addItem: (product: Product, quantity: number, options: CartItemOption[], specialRequest?: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  removeItem: (itemId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((product: Product, quantity: number, options: CartItemOption[], specialRequest?: string) => {
    setItems(prev => {
      // Create a unique key based on product + options
      const optionKey = options.map(o => o.option_id).sort().join('-')
      const existingIndex = prev.findIndex(
        item => item.product_id === product.id && 
                item.selected_options.map(o => o.option_id).sort().join('-') === optionKey &&
                item.special_request === specialRequest
      )

      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        }
        return updated
      }

      const rawImage =
        (typeof product.image_url === 'string' && product.image_url) ||
        (Array.isArray(product.images) && typeof product.images[0]?.url === 'string' ? product.images[0].url : '') ||
        ''
      const safeImage = typeof rawImage === 'string' && rawImage.trim().length > 0 ? rawImage.trim() : ''
      const product_image = safeImage

      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        product_id: product.id,
        product_name: product.name_ko,
        product_image,
        base_price_vnd: product.base_price_vnd,
        quantity,
        selected_options: options,
        special_request: specialRequest,
      }

      return [...prev, newItem]
    })
  }, [])

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(item => item.id !== itemId))
    } else {
      setItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      )
    }
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const { subtotal, deliveryFee, total, itemCount } = useMemo(() => {
    const sub = items.reduce((acc, item) => {
      const optionsTotal = item.selected_options.reduce((sum, opt) => sum + opt.price_delta_vnd, 0)
      return acc + (item.base_price_vnd + optionsTotal) * item.quantity
    }, 0)

    const count = items.reduce((acc, item) => acc + item.quantity, 0)
    const threshold = CART_DELIVERY_FALLBACK.free_delivery_threshold_vnd
    const feeAmount = CART_DELIVERY_FALLBACK.delivery_fee_vnd
    const fee = sub >= threshold ? 0 : feeAmount

    return {
      subtotal: sub,
      deliveryFee: fee,
      total: sub + fee,
      itemCount: count,
    }
  }, [items])

  return (
    <CartContext.Provider value={{
      items,
      itemCount,
      subtotal,
      deliveryFee,
      total,
      deliverySettings: CART_DELIVERY_FALLBACK,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
