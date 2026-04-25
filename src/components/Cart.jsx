import { useCart } from '../context/CartContext'

export default function Cart() {
  const { cartItems, addToCart, removeFromCart, clearCart, closeCart, openCheckout, subtotal, tax, total } = useCart()

  return (
    <>
      <div style={styles.overlay} onClick={closeCart} />
      <aside style={styles.drawer}>
        <div style={styles.drawerHeader}>
          <h2 style={styles.drawerTitle}>Your Order</h2>
          <button style={styles.closeBtn} onClick={closeCart}>✕</button>
        </div>

        {cartItems.length === 0 ? (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>🛒</span>
            <p style={styles.emptyText}>Your cart is empty</p>
            <p style={styles.emptyHint}>Add items from the menu to get started</p>
          </div>
        ) : (
          <>
            <div style={styles.itemList}>
              {cartItems.map(item => (
                <div key={item.id} style={styles.cartItem}>
                  <span style={styles.itemEmoji}>{item.emoji}</span>
                  <div style={styles.itemInfo}>
                    <p style={styles.itemName}>{item.name}</p>
                    <p style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <div style={styles.qtyControls}>
                    <button style={styles.qtyBtn} onClick={() => removeFromCart(item)}>−</button>
                    <span style={styles.qty}>{item.quantity}</span>
                    <button style={styles.qtyBtn} onClick={() => addToCart(item)}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.summary}>
              <div style={styles.summaryRow}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={styles.summaryRow}>
                <span>Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div style={{ ...styles.summaryRow, ...styles.totalRow }}>
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <div style={styles.actions}>
              <button style={styles.placeOrderBtn} onClick={openCheckout}>
                Checkout · ${total.toFixed(2)} →
              </button>
              <button style={styles.clearBtn} onClick={clearCart}>Clear Cart</button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200,
  },
  drawer: {
    position: 'fixed', top: 0, right: 0, bottom: 0,
    width: 380, maxWidth: '100vw',
    background: '#fff', zIndex: 201,
    display: 'flex', flexDirection: 'column',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
  },
  drawerHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 24px', borderBottom: '1px solid #f0f0f0',
  },
  drawerTitle: { fontSize: 20, fontWeight: 700 },
  closeBtn: {
    background: '#f5f5f0', border: 'none', width: 36, height: 36,
    borderRadius: '50%', fontSize: 16, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  empty: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40,
  },
  emptyIcon: { fontSize: 56 },
  emptyText: { fontSize: 18, fontWeight: 600, color: '#333' },
  emptyHint: { fontSize: 14, color: '#999', textAlign: 'center' },
  itemList: {
    flex: 1, overflowY: 'auto', padding: '12px 24px',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  cartItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#fafaf8', borderRadius: 12, padding: '12px 14px',
  },
  itemEmoji: { fontSize: 28, flexShrink: 0 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: 600 },
  itemPrice: { fontSize: 13, color: '#e94560', fontWeight: 600, marginTop: 2 },
  qtyControls: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#ebebeb', borderRadius: 8, padding: '4px 8px',
  },
  qtyBtn: {
    background: 'none', border: 'none', fontSize: 16, fontWeight: 700,
    cursor: 'pointer', color: '#1a1a2e',
  },
  qty: { fontSize: 14, fontWeight: 700, minWidth: 18, textAlign: 'center' },
  summary: {
    padding: '16px 24px', borderTop: '1px solid #f0f0f0',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#555' },
  totalRow: { fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginTop: 4 },
  actions: {
    padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 10,
  },
  placeOrderBtn: {
    background: '#e94560', color: '#fff', border: 'none', borderRadius: 12,
    padding: '15px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
  },
  clearBtn: {
    background: 'none', border: '1px solid #ddd', borderRadius: 12,
    padding: '12px', fontSize: 14, fontWeight: 500, cursor: 'pointer', color: '#777',
  },
}
