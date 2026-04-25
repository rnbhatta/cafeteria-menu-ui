import { useCart } from '../context/CartContext'
import { tagColors } from '../data/menuData'

export default function MenuCard({ item }) {
  const { getQty, addToCart, removeFromCart } = useCart()
  const quantity = getQty(item.id)

  return (
    <div style={styles.card}>
      {item.popular && <span style={styles.popularBadge}>Popular</span>}
      <div style={styles.emojiBox}>{item.emoji}</div>
      <div style={styles.body}>
        <div style={styles.topRow}>
          <h3 style={styles.name}>{item.name}</h3>
          <div style={styles.rating}>
            <span style={{ color: '#f59e0b' }}>★</span>
            <span style={styles.ratingText}>{item.rating}</span>
          </div>
        </div>
        <p style={styles.description}>{item.description}</p>
        <div style={styles.tags}>
          {item.tags.map(tag => (
            <span
              key={tag}
              style={{
                ...styles.tag,
                background: tagColors[tag]?.bg || '#f0f0f0',
                color: tagColors[tag]?.text || '#555',
              }}
            >
              {tag}
            </span>
          ))}
          <span style={styles.calories}>{item.calories} cal</span>
        </div>
        <div style={styles.footer}>
          <span style={styles.price}>${item.price.toFixed(2)}</span>
          {quantity === 0 ? (
            <button style={styles.addBtn} onClick={() => addToCart(item)}>
              + Add
            </button>
          ) : (
            <div style={styles.qtyControls}>
              <button style={styles.qtyBtn} onClick={() => removeFromCart(item)}>−</button>
              <span style={styles.qty}>{quantity}</span>
              <button style={styles.qtyBtn} onClick={() => addToCart(item)}>+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    background: '#e94560',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 9px',
    borderRadius: 20,
    zIndex: 1,
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
  },
  emojiBox: {
    background: '#f8f7f2',
    fontSize: 52,
    textAlign: 'center',
    padding: '24px 0 20px',
    lineHeight: 1,
  },
  body: {
    padding: '16px 18px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: { fontSize: 16, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3 },
  rating: { display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 },
  ratingText: { fontSize: 13, fontWeight: 600, color: '#555' },
  description: { fontSize: 13, color: '#777', lineHeight: 1.5 },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    marginTop: 2,
  },
  tag: {
    fontSize: 11,
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: 20,
    textTransform: 'capitalize',
  },
  calories: { fontSize: 11, color: '#999', fontWeight: 500 },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  price: { fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  addBtn: {
    background: '#1a1a2e',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '8px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  qtyControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#f0f0f0',
    borderRadius: 10,
    padding: '4px 8px',
  },
  qtyBtn: {
    background: 'none',
    border: 'none',
    fontSize: 18,
    fontWeight: 700,
    cursor: 'pointer',
    color: '#1a1a2e',
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  qty: { fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: 'center' },
}
