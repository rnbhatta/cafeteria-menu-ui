import { createContext, useContext, useState, useMemo } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const cartCount = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.quantity, 0),
    [cartItems]
  )

  const subtotal = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cartItems]
  )

  const tax = subtotal * 0.1
  const total = subtotal + tax

  function getQty(itemId) {
    return cartItems.find(i => i.id === itemId)?.quantity || 0
  }

  function addToCart(item) {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  function removeFromCart(item) {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing?.quantity === 1) return prev.filter(i => i.id !== item.id)
      return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i)
    })
  }

  function clearCart() {
    setCartItems([])
  }

  function openCart() {
    setCartOpen(true)
  }

  function closeCart() {
    setCartOpen(false)
  }

  function openCheckout() {
    setCartOpen(false)
    setCheckoutOpen(true)
  }

  function closeCheckout() {
    setCheckoutOpen(false)
  }

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      subtotal,
      tax,
      total,
      getQty,
      addToCart,
      removeFromCart,
      clearCart,
      cartOpen,
      openCart,
      closeCart,
      checkoutOpen,
      openCheckout,
      closeCheckout,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
