import { useState } from 'react'
import { useCart } from '../context/CartContext'
import OrderConfirmation from './OrderConfirmation'
import { placeOrder } from '../services/api'

const STEPS = ['Review', 'Details', 'Payment']

export default function Checkout() {
  const { cartItems, subtotal, tax, total, clearCart, closeCheckout } = useCart()

  const [step, setStep] = useState(0)
  const [details, setDetails] = useState({ name: '', email: '', seat: '', notes: '' })
  const [payment, setPayment] = useState({ method: 'card', cardNumber: '', expiry: '', cvv: '', upiId: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [orderData, setOrderData] = useState(null)

  function validateDetails() {
    const e = {}
    if (!details.name.trim()) e.name = 'Name is required'
    if (!details.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(details.email)) e.email = 'Enter a valid email'
    if (!details.seat.trim()) e.seat = 'Seat / desk number is required'
    return e
  }

  function validatePayment() {
    const e = {}
    if (payment.method === 'card') {
      const raw = payment.cardNumber.replace(/\s/g, '')
      if (!raw) e.cardNumber = 'Card number is required'
      else if (raw.length !== 16) e.cardNumber = 'Must be 16 digits'
      if (!payment.expiry) e.expiry = 'Expiry is required'
      else {
        const [mm, yy] = payment.expiry.split('/')
        const now = new Date()
        const exp = new Date(2000 + parseInt(yy || '0'), parseInt(mm || '0') - 1)
        if (!mm || !yy || mm > 12 || exp < now) e.expiry = 'Invalid or expired date'
      }
      if (!payment.cvv) e.cvv = 'CVV is required'
      else if (!/^\d{3,4}$/.test(payment.cvv)) e.cvv = '3 or 4 digits'
    }
    if (payment.method === 'upi') {
      if (!payment.upiId.trim()) e.upiId = 'UPI ID is required'
      else if (!payment.upiId.includes('@')) e.upiId = 'Enter a valid UPI ID (e.g. name@upi)'
    }
    return e
  }

  function handleNext() {
    if (step === 1) {
      const e = validateDetails()
      if (Object.keys(e).length) { setErrors(e); return }
    }
    setErrors({})
    setStep(s => s + 1)
  }

  function handleBack() {
    setErrors({})
    setStep(s => s - 1)
  }

  async function handlePlaceOrder() {
    const e = validatePayment()
    if (Object.keys(e).length) { setErrors(e); return }
    setSubmitting(true)
    try {
      const saved = await placeOrder({
        items: cartItems.map(({ id, name, price, quantity, emoji }) => ({ id, name, price, quantity, emoji })),
        details,
        payment: { method: payment.method },
        subtotal,
        tax,
        total,
      })
      setOrderData({
        orderId: saved.order_id,
        items: cartItems,
        details,
        payment: { method: payment.method },
        subtotal,
        tax,
        total,
        placedAt: new Date(saved.placed_at),
        estimatedReady: new Date(saved.estimated_ready),
      })
      clearCart()
    } catch {
      setErrors({ submit: 'Failed to place order. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  function formatCard(val) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  }

  function formatExpiry(val) {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
    return digits
  }

  if (orderData) {
    return <OrderConfirmation order={orderData} onClose={closeCheckout} />
  }

  return (
    <>
      <div style={styles.overlay} onClick={closeCheckout} />
      <aside style={styles.modal}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Checkout</h2>
            <p style={styles.stepLabel}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          </div>
          <button style={styles.closeBtn} onClick={closeCheckout}>✕</button>
        </div>

        <div style={styles.stepper}>
          {STEPS.map((s, i) => (
            <div key={s} style={styles.stepItem}>
              <div style={{
                ...styles.stepDot,
                background: i <= step ? '#e94560' : '#e0e0e0',
                color: i <= step ? '#fff' : '#999',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ ...styles.stepText, color: i <= step ? '#1a1a1a' : '#aaa' }}>{s}</span>
              {i < STEPS.length - 1 && (
                <div style={{ ...styles.stepLine, background: i < step ? '#e94560' : '#e0e0e0' }} />
              )}
            </div>
          ))}
        </div>

        <div style={styles.body}>
          {step === 0 && <ReviewStep items={cartItems} subtotal={subtotal} tax={tax} total={total} />}
          {step === 1 && <DetailsStep details={details} setDetails={setDetails} errors={errors} />}
          {step === 2 && (
            <PaymentStep
              payment={payment}
              setPayment={setPayment}
              errors={errors}
              formatCard={formatCard}
              formatExpiry={formatExpiry}
              total={total}
            />
          )}
        </div>

        <div style={styles.footer}>
          {errors.submit && (
            <p style={{ color: '#e94560', fontSize: 13, width: '100%', marginBottom: 4 }}>{errors.submit}</p>
          )}
          {step > 0 && (
            <button style={styles.backBtn} onClick={handleBack} disabled={submitting}>
              ← Back
            </button>
          )}
          {step < 2 ? (
            <button style={styles.nextBtn} onClick={handleNext}>
              {step === 0 ? 'Continue to Details' : 'Continue to Payment'} →
            </button>
          ) : (
            <button style={{ ...styles.nextBtn, ...styles.placeBtn }} onClick={handlePlaceOrder} disabled={submitting}>
              {submitting ? <span style={styles.spinner}>Processing...</span> : `Place Order · $${total.toFixed(2)}`}
            </button>
          )}
        </div>
      </aside>
    </>
  )
}

function ReviewStep({ items, subtotal, tax, total }) {
  return (
    <div style={styles.reviewStep}>
      <div style={styles.itemList}>
        {items.map(item => (
          <div key={item.id} style={styles.reviewItem}>
            <span style={{ fontSize: 26 }}>{item.emoji}</span>
            <div style={{ flex: 1 }}>
              <p style={styles.itemName}>{item.name}</p>
              <p style={styles.itemQty}>× {item.quantity}</p>
            </div>
            <span style={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div style={styles.summaryBox}>
        <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
        <Row label="Tax (10%)" value={`$${tax.toFixed(2)}`} />
        <div style={styles.divider} />
        <Row label="Total" value={`$${total.toFixed(2)}`} bold />
      </div>
    </div>
  )
}

function DetailsStep({ details, setDetails, errors }) {
  function set(key) {
    return e => setDetails(d => ({ ...d, [key]: e.target.value }))
  }
  return (
    <div style={styles.form}>
      <h3 style={styles.sectionTitle}>Delivery Details</h3>
      <Field label="Full Name" error={errors.name}>
        <input style={inputStyle(errors.name)} placeholder="e.g. Alex Johnson" value={details.name} onChange={set('name')} />
      </Field>
      <Field label="Work Email" error={errors.email}>
        <input style={inputStyle(errors.email)} type="email" placeholder="you@company.com" value={details.email} onChange={set('email')} />
      </Field>
      <Field label="Seat / Desk Number" error={errors.seat}>
        <input style={inputStyle(errors.seat)} placeholder="e.g. A-204 or Floor 3, Hot Desk 7" value={details.seat} onChange={set('seat')} />
      </Field>
      <Field label="Special Instructions (optional)">
        <textarea
          style={{ ...inputStyle(false), resize: 'vertical', minHeight: 80, paddingTop: 10 }}
          placeholder="Allergies, no spice, extra sauce..."
          value={details.notes}
          onChange={set('notes')}
        />
      </Field>
    </div>
  )
}

function PaymentStep({ payment, setPayment, errors, formatCard, formatExpiry, total }) {
  function set(key) {
    return val => setPayment(p => ({ ...p, [key]: val }))
  }
  return (
    <div style={styles.form}>
      <h3 style={styles.sectionTitle}>Payment Method</h3>

      <div style={styles.methodGroup}>
        {[
          { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
          { id: 'upi', label: 'UPI', icon: '📱' },
          { id: 'cash', label: 'Pay at Counter', icon: '💵' },
        ].map(m => (
          <button
            key={m.id}
            style={{ ...styles.methodBtn, ...(payment.method === m.id ? styles.methodBtnActive : {}) }}
            onClick={() => set('method')(m.id)}
          >
            <span style={{ fontSize: 20 }}>{m.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{m.label}</span>
          </button>
        ))}
      </div>

      {payment.method === 'card' && (
        <>
          <Field label="Card Number" error={errors.cardNumber}>
            <input
              style={inputStyle(errors.cardNumber)}
              placeholder="1234 5678 9012 3456"
              value={payment.cardNumber}
              onChange={e => set('cardNumber')(formatCard(e.target.value))}
              maxLength={19}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Expiry (MM/YY)" error={errors.expiry}>
              <input
                style={inputStyle(errors.expiry)}
                placeholder="09/27"
                value={payment.expiry}
                onChange={e => set('expiry')(formatExpiry(e.target.value))}
                maxLength={5}
              />
            </Field>
            <Field label="CVV" error={errors.cvv}>
              <input
                style={inputStyle(errors.cvv)}
                placeholder="123"
                value={payment.cvv}
                onChange={e => set('cvv')(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
              />
            </Field>
          </div>
        </>
      )}

      {payment.method === 'upi' && (
        <Field label="UPI ID" error={errors.upiId}>
          <input
            style={inputStyle(errors.upiId)}
            placeholder="yourname@upi"
            value={payment.upiId}
            onChange={e => set('upiId')(e.target.value)}
          />
        </Field>
      )}

      {payment.method === 'cash' && (
        <div style={styles.cashNote}>
          <span style={{ fontSize: 28 }}>🪙</span>
          <p style={{ fontWeight: 600 }}>Pay ${total.toFixed(2)} at the cafeteria counter</p>
          <p style={{ color: '#777', fontSize: 13 }}>Show your order confirmation to the cashier</p>
        </div>
      )}
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={styles.label}>{label}</label>
      {children}
      {error && <span style={styles.error}>{error}</span>}
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: bold ? 16 : 14, fontWeight: bold ? 700 : 400, color: bold ? '#1a1a1a' : '#555' }}>
      <span>{label}</span><span>{value}</span>
    </div>
  )
}

function inputStyle(hasError) {
  return {
    border: `1.5px solid ${hasError ? '#e94560' : '#e0e0e0'}`,
    borderRadius: 10,
    padding: '11px 14px',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
    background: hasError ? '#fff5f6' : '#fff',
  }
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 },
  modal: {
    position: 'fixed', top: 0, right: 0, bottom: 0,
    width: 480, maxWidth: '100vw',
    background: '#fff', zIndex: 301,
    display: 'flex', flexDirection: 'column',
    boxShadow: '-4px 0 32px rgba(0,0,0,0.18)',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '20px 24px', borderBottom: '1px solid #f0f0f0',
  },
  title: { fontSize: 20, fontWeight: 700 },
  stepLabel: { fontSize: 13, color: '#999', marginTop: 3 },
  closeBtn: {
    background: '#f5f5f0', border: 'none', width: 36, height: 36,
    borderRadius: '50%', fontSize: 15, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepper: {
    display: 'flex', alignItems: 'center',
    padding: '16px 24px', borderBottom: '1px solid #f0f0f0', gap: 0,
  },
  stepItem: { display: 'flex', alignItems: 'center', gap: 6, flex: 1 },
  stepDot: {
    width: 28, height: 28, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  stepText: { fontSize: 12, fontWeight: 600 },
  stepLine: { flex: 1, height: 2, marginLeft: 6 },
  body: { flex: 1, overflowY: 'auto', padding: '20px 24px' },
  footer: {
    padding: '16px 24px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 10,
  },
  backBtn: {
    background: 'none', border: '1.5px solid #e0e0e0', borderRadius: 12,
    padding: '13px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#555',
  },
  nextBtn: {
    flex: 1, background: '#1a1a2e', color: '#fff', border: 'none',
    borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  placeBtn: { background: '#e94560' },
  spinner: { opacity: 0.8 },
  reviewStep: { display: 'flex', flexDirection: 'column', gap: 16 },
  itemList: { display: 'flex', flexDirection: 'column', gap: 10 },
  reviewItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#fafaf8', borderRadius: 12, padding: '12px 14px',
  },
  itemName: { fontSize: 14, fontWeight: 600 },
  itemQty: { fontSize: 13, color: '#888', marginTop: 2 },
  itemTotal: { fontSize: 15, fontWeight: 700, color: '#1a1a2e' },
  summaryBox: {
    background: '#f5f5f0', borderRadius: 12, padding: '16px',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  divider: { height: 1, background: '#e0e0e0', margin: '4px 0' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  label: { fontSize: 13, fontWeight: 600, color: '#444' },
  error: { fontSize: 12, color: '#e94560' },
  methodGroup: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 },
  methodBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    border: '1.5px solid #e0e0e0', borderRadius: 12, padding: '14px 8px',
    background: '#fff', cursor: 'pointer',
  },
  methodBtnActive: { border: '2px solid #e94560', background: '#fff5f6' },
  cashNote: {
    background: '#f5f5f0', borderRadius: 12, padding: '20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 8, textAlign: 'center',
  },
}
