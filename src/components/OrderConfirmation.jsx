export default function OrderConfirmation({ order, onClose }) {
  const readyTime = order.estimatedReady.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  })

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <aside style={styles.modal}>
        <div style={styles.successBanner}>
          <div style={styles.checkCircle}>✓</div>
          <h2 style={styles.successTitle}>Order Placed!</h2>
          <p style={styles.orderId}>Order #{order.orderId}</p>
        </div>

        <div style={styles.body}>
          <div style={styles.etaCard}>
            <span style={styles.etaIcon}>⏱️</span>
            <div>
              <p style={styles.etaLabel}>Estimated Ready</p>
              <p style={styles.etaTime}>{readyTime}</p>
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Delivery To</h3>
            <div style={styles.infoGrid}>
              <InfoRow icon="👤" label="Name" value={order.details.name} />
              <InfoRow icon="📧" label="Email" value={order.details.email} />
              <InfoRow icon="🪑" label="Seat" value={order.details.seat} />
              {order.details.notes && (
                <InfoRow icon="📝" label="Notes" value={order.details.notes} />
              )}
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Order Summary</h3>
            <div style={styles.itemList}>
              {order.items.map(item => (
                <div key={item.id} style={styles.orderItem}>
                  <span style={{ fontSize: 22 }}>{item.emoji}</span>
                  <span style={styles.itemName}>{item.name}</span>
                  <span style={styles.itemQty}>× {item.quantity}</span>
                  <span style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={styles.totals}>
              <TotalRow label="Subtotal" value={`$${order.subtotal.toFixed(2)}`} />
              <TotalRow label="Tax (10%)" value={`$${order.tax.toFixed(2)}`} />
              <div style={styles.totalDivider} />
              <TotalRow label="Total Paid" value={`$${order.total.toFixed(2)}`} bold />
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Payment</h3>
            <div style={styles.paymentBadge}>
              {order.payment.method === 'card' && '💳 Card Payment'}
              {order.payment.method === 'upi' && '📱 UPI Payment'}
              {order.payment.method === 'cash' && '💵 Pay at Counter'}
              <span style={styles.paidTag}>
                {order.payment.method === 'cash' ? 'Pending' : 'Paid'}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button style={styles.doneBtn} onClick={onClose}>
            Back to Menu
          </button>
        </div>
      </aside>
    </>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={styles.infoRow}>
      <span>{icon}</span>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value}</span>
    </div>
  )
}

function TotalRow({ label, value, bold }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontSize: bold ? 16 : 14,
      fontWeight: bold ? 700 : 400,
      color: bold ? '#1a1a1a' : '#666',
    }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400 },
  modal: {
    position: 'fixed', top: 0, right: 0, bottom: 0,
    width: 480, maxWidth: '100vw',
    background: '#fff', zIndex: 401,
    display: 'flex', flexDirection: 'column',
    boxShadow: '-4px 0 32px rgba(0,0,0,0.18)',
  },
  successBanner: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    color: '#fff',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    textAlign: 'center',
  },
  checkCircle: {
    width: 60, height: 60, borderRadius: '50%',
    background: '#22c55e', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 26, fontWeight: 700, marginBottom: 4,
  },
  successTitle: { fontSize: 24, fontWeight: 700 },
  orderId: { fontSize: 14, color: '#a0a0c0', fontWeight: 500 },
  body: { flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 },
  etaCard: {
    background: '#fff9ec',
    border: '1.5px solid #fde68a',
    borderRadius: 14,
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  etaIcon: { fontSize: 32 },
  etaLabel: { fontSize: 13, color: '#92400e', fontWeight: 600 },
  etaTime: { fontSize: 22, fontWeight: 700, color: '#78350f' },
  section: { display: 'flex', flexDirection: 'column', gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoGrid: { background: '#fafaf8', borderRadius: 12, padding: '4px 0', display: 'flex', flexDirection: 'column' },
  infoRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px',
    borderBottom: '1px solid #f0f0f0',
  },
  infoLabel: { fontSize: 13, color: '#888', width: 54, flexShrink: 0 },
  infoValue: { fontSize: 14, fontWeight: 500, flex: 1 },
  itemList: { display: 'flex', flexDirection: 'column', gap: 8 },
  orderItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#fafaf8', borderRadius: 10, padding: '10px 12px',
  },
  itemName: { flex: 1, fontSize: 14, fontWeight: 500 },
  itemQty: { fontSize: 13, color: '#888' },
  itemPrice: { fontSize: 14, fontWeight: 700, color: '#1a1a2e' },
  totals: { background: '#f5f5f0', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  totalDivider: { height: 1, background: '#e0e0e0', margin: '2px 0' },
  paymentBadge: {
    background: '#fafaf8', borderRadius: 12, padding: '14px 16px',
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 14, fontWeight: 600,
  },
  paidTag: {
    marginLeft: 'auto', background: '#dcfce7', color: '#166534',
    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
  },
  footer: { padding: '16px 24px 24px', borderTop: '1px solid #f0f0f0' },
  doneBtn: {
    width: '100%', background: '#1a1a2e', color: '#fff',
    border: 'none', borderRadius: 12, padding: '15px',
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
  },
}
