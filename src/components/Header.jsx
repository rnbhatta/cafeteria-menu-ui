import { useCart } from '../context/CartContext'

export default function Header({ onOpenQuery, onOpenAgent }) {
  const { cartCount, openCart } = useCart()

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <div style={styles.brand}>
          <span style={styles.logo}>🍴</span>
          <div>
            <h1 style={styles.title}>Office Cafeteria</h1>
            <p style={styles.subtitle}>{today}</p>
          </div>
        </div>
        <div style={styles.actions}>
          <button style={styles.agentBtn} onClick={onOpenAgent}>
            <span>🤖</span>
            <span>AI Assistant</span>
          </button>
          <button style={styles.queryBtn} onClick={onOpenQuery}>
            <span>🔎</span>
            <span>Query DB</span>
          </button>
          <button style={styles.cartBtn} onClick={openCart}>
            <span style={styles.cartIcon}>🛒</span>
            <span>Cart</span>
            {cartCount > 0 && <span style={styles.badge}>{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  )
}

const styles = {
  header: {
    background: '#1a1a2e',
    color: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
  },
  inner: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  logo: { fontSize: 32 },
  title: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' },
  subtitle: { fontSize: 13, color: '#a0a0c0', marginTop: 2 },
  actions: { display: 'flex', alignItems: 'center', gap: 10 },
  agentBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(233,69,96,0.85)',
    color: '#fff',
    border: '1.5px solid rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  queryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    border: '1.5px solid rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  cartBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    position: 'relative',
    transition: 'transform 0.1s, background 0.2s',
  },
  cartIcon: { fontSize: 18 },
  badge: {
    background: '#fff',
    color: '#e94560',
    borderRadius: '50%',
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
  },
}
