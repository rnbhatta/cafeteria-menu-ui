import { useState, useEffect, useCallback } from 'react'
import { fetchOrderAnalytics, fetchInferenceAnalytics } from '../services/api'

// ─── tiny helpers ────────────────────────────────────────────────────────────

function fmt$(n) { return `$${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function fmtN(n) { return (n ?? 0).toLocaleString('en-US') }
function fmtMs(ms) { return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms` }

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ ...S.card, borderTop: `3px solid ${accent || '#1a1a2e'}` }}>
      <div style={S.cardValue}>{value}</div>
      <div style={S.cardLabel}>{label}</div>
      {sub && <div style={S.cardSub}>{sub}</div>}
    </div>
  )
}

function MiniBarChart({ data, xKey, yKey, color, formatY }) {
  if (!data?.length) return <div style={S.empty}>No data yet</div>
  const max = Math.max(...data.map(d => d[yKey]), 1)
  return (
    <div style={S.barChart}>
      {data.map((d, i) => (
        <div key={i} style={S.barCol}>
          <div style={S.barLabel}>{formatY ? formatY(d[yKey]) : d[yKey]}</div>
          <div style={S.barTrack}>
            <div style={{ ...S.barFill, height: `${Math.max((d[yKey] / max) * 100, 2)}%`, background: color || '#1a1a2e' }} />
          </div>
          <div style={S.barXLabel}>{String(d[xKey]).slice(5)}</div>
        </div>
      ))}
    </div>
  )
}

function HorizBar({ label, value, max, color, sub }) {
  const pct = max > 0 ? Math.max((value / max) * 100, 1) : 0
  return (
    <div style={S.hBarRow}>
      <div style={S.hBarLabel}>{label}</div>
      <div style={S.hBarTrack}>
        <div style={{ ...S.hBarFill, width: `${pct}%`, background: color || '#1a1a2e' }} />
      </div>
      <div style={S.hBarVal}>{sub ?? fmtN(value)}</div>
    </div>
  )
}

function SectionHeader({ children }) {
  return <h3 style={S.sectionHeader}>{children}</h3>
}

// ─── tabs ────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'retail',    label: '🛍 Retail Orders' },
  { id: 'inference', label: '🤖 AI Inference' },
]

// ─── main component ───────────────────────────────────────────────────────────

export default function Analytics({ onClose }) {
  const [tab, setTab] = useState('retail')
  const [orders, setOrders]     = useState(null)
  const [inference, setInfer]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const load = useCallback(async (which) => {
    setLoading(true)
    setError(null)
    try {
      if (which === 'retail' && !orders) {
        setOrders(await fetchOrderAnalytics())
      } else if (which === 'inference' && !inference) {
        setInfer(await fetchInferenceAnalytics())
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [orders, inference])

  useEffect(() => { load(tab) }, [tab]) // eslint-disable-line

  const handleTabClick = (id) => { setTab(id); load(id) }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.panel} onClick={e => e.stopPropagation()}>

        {/* header */}
        <div style={S.header}>
          <div>
            <div style={S.headerTitle}>Analytics Dashboard</div>
            <div style={S.headerSub}>MongoDB OLTP · Live aggregations</div>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* tabs */}
        <div style={S.tabs}>
          {TABS.map(t => (
            <button
              key={t.id}
              style={{ ...S.tabBtn, ...(tab === t.id ? S.tabActive : {}) }}
              onClick={() => handleTabClick(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* body */}
        <div style={S.body}>
          {loading && (
            <div style={S.loading}>
              <span style={{ fontSize: 40 }}>⏳</span>
              <p style={{ marginTop: 12 }}>Running aggregation pipeline…</p>
            </div>
          )}
          {error && !loading && (
            <div style={S.errBox}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* ── RETAIL TAB ── */}
          {tab === 'retail' && orders && !loading && (
            <div>
              {/* summary cards */}
              <div style={S.cardRow}>
                <StatCard label="Total Orders"     value={fmtN(orders.summary.total_orders)}      accent="#1a1a2e" />
                <StatCard label="Total Revenue"    value={fmt$(orders.summary.total_revenue)}     accent="#e94560" />
                <StatCard label="Avg Order Value"  value={fmt$(orders.summary.avg_order_value)}   accent="#4caf82" />
                <StatCard label="Items Sold"       value={fmtN(orders.summary.total_items_sold)}  accent="#f5a623" />
              </div>

              {/* daily revenue chart */}
              <SectionHeader>Daily Revenue — Last 7 Days</SectionHeader>
              <MiniBarChart data={orders.daily} xKey="date" yKey="revenue" color="#e94560" formatY={fmt$} />

              {/* daily orders chart */}
              <SectionHeader>Daily Orders — Last 7 Days</SectionHeader>
              <MiniBarChart data={orders.daily} xKey="date" yKey="orders" color="#1a1a2e" />

              <div style={S.twoCol}>
                {/* top items */}
                <div>
                  <SectionHeader>Top Items by Quantity Sold</SectionHeader>
                  {orders.top_items.length === 0
                    ? <div style={S.empty}>No orders yet</div>
                    : orders.top_items.map((item, i) => (
                      <HorizBar
                        key={item.name}
                        label={`${item.emoji || ''} ${item.name}`}
                        value={item.quantity}
                        max={orders.top_items[0]?.quantity || 1}
                        color={i === 0 ? '#e94560' : '#1a1a2e'}
                        sub={`${fmtN(item.quantity)} sold · ${fmt$(item.revenue)}`}
                      />
                    ))
                  }
                </div>

                {/* category + payment */}
                <div>
                  <SectionHeader>Revenue by Category</SectionHeader>
                  {orders.categories.map((c, i) => (
                    <HorizBar
                      key={c.category}
                      label={c.category}
                      value={c.revenue}
                      max={orders.categories[0]?.revenue || 1}
                      color={['#e94560','#1a1a2e','#4caf82','#f5a623','#9c27b0'][i % 5]}
                      sub={fmt$(c.revenue)}
                    />
                  ))}

                  <SectionHeader>Payment Methods</SectionHeader>
                  {orders.payments.map((p, i) => (
                    <HorizBar
                      key={p.method}
                      label={p.method.toUpperCase()}
                      value={p.count}
                      max={orders.payments[0]?.count || 1}
                      color={['#4caf82','#f5a623','#1a1a2e'][i % 3]}
                      sub={`${p.count} orders`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── INFERENCE TAB ── */}
          {tab === 'inference' && inference && !loading && (
            <div>
              {/* summary cards */}
              <div style={S.cardRow}>
                <StatCard label="AI Requests"     value={fmtN(inference.summary.total_requests)}    accent="#1a1a2e" />
                <StatCard label="Tokens In"        value={fmtN(inference.summary.total_input_tokens)}  accent="#4caf82"
                           sub={`avg ${fmtN(Math.round((inference.summary.total_input_tokens||0) / Math.max(inference.summary.total_requests,1)))} / req`} />
                <StatCard label="Tokens Out"       value={fmtN(inference.summary.total_output_tokens)} accent="#9c27b0"
                           sub={`avg ${fmtN(Math.round((inference.summary.total_output_tokens||0) / Math.max(inference.summary.total_requests,1)))} / req`} />
                <StatCard label="Est. Cost"        value={`$${(inference.summary.estimated_cost_usd||0).toFixed(4)}`} accent="#e94560"
                           sub="Claude Sonnet 4.6" />
              </div>
              <div style={{ ...S.cardRow, marginTop: 12 }}>
                <StatCard label="Avg Latency"     value={fmtMs(inference.summary.avg_latency_ms)}   accent="#f5a623" />
                <StatCard label="Total Tool Calls" value={fmtN(inference.summary.total_tool_calls)}  accent="#2196f3" />
                <StatCard label="Avg Tools / Req"  value={(inference.summary.avg_tool_calls||0).toFixed(1)} accent="#00bcd4" />
                <StatCard label="Success Rate"     value={`${inference.summary.success_rate}%`}      accent="#4caf82" />
              </div>

              {/* daily requests chart */}
              <SectionHeader>Daily AI Requests — Last 7 Days</SectionHeader>
              {inference.daily.length === 0
                ? <div style={S.empty}>No inference data yet — use the AI Assistant to generate logs</div>
                : <MiniBarChart data={inference.daily} xKey="date" yKey="requests" color="#1a1a2e" />
              }

              {/* daily token usage */}
              {inference.daily.length > 0 && (
                <>
                  <SectionHeader>Daily Token Consumption</SectionHeader>
                  <div style={S.tokenChart}>
                    {inference.daily.map((d, i) => {
                      const maxT = Math.max(...inference.daily.map(x => x.input_tokens + x.output_tokens), 1)
                      const total = d.input_tokens + d.output_tokens
                      return (
                        <div key={i} style={S.tokenCol}>
                          <div style={S.tokenBar}>
                            <div style={{ height: `${(d.output_tokens / maxT) * 100}%`, background: '#9c27b0', borderRadius: '3px 3px 0 0' }} />
                            <div style={{ height: `${(d.input_tokens  / maxT) * 100}%`, background: '#4caf82' }} />
                          </div>
                          <div style={S.barXLabel}>{String(d.date).slice(5)}</div>
                          <div style={{ ...S.barXLabel, color: '#999', marginTop: 2 }}>{fmtN(total)}</div>
                        </div>
                      )
                    })}
                    <div style={S.tokenLegend}>
                      <span style={{ color: '#4caf82' }}>■</span> Input &nbsp;
                      <span style={{ color: '#9c27b0' }}>■</span> Output
                    </div>
                  </div>
                </>
              )}

              <div style={S.twoCol}>
                {/* tool usage */}
                <div>
                  <SectionHeader>Tool Call Frequency</SectionHeader>
                  {inference.tools.length === 0
                    ? <div style={S.empty}>No tool calls logged</div>
                    : inference.tools.map((t, i) => (
                      <HorizBar
                        key={t.tool}
                        label={t.tool}
                        value={t.count}
                        max={inference.tools[0]?.count || 1}
                        color={['#2196f3','#00bcd4','#4caf82','#f5a623','#e94560'][i % 5]}
                        sub={`${t.count}×`}
                      />
                    ))
                  }
                </div>

                {/* latency + models */}
                <div>
                  <SectionHeader>Latency Distribution</SectionHeader>
                  {inference.latency_dist.length === 0
                    ? <div style={S.empty}>No data</div>
                    : inference.latency_dist.map((b, i) => (
                      <HorizBar
                        key={b.bucket}
                        label={b.bucket}
                        value={b.count}
                        max={Math.max(...inference.latency_dist.map(x => x.count), 1)}
                        color={['#4caf82','#f5a623','#e94560','#9c27b0','#1a1a2e','#2196f3'][i % 6]}
                        sub={`${b.count} req`}
                      />
                    ))
                  }

                  <SectionHeader>Models</SectionHeader>
                  {inference.models.map((m, i) => (
                    <div key={m.model} style={S.modelRow}>
                      <div style={S.modelName}>{m.model}</div>
                      <div style={S.modelStats}>
                        <span>{m.requests} req</span>
                        <span>{fmtN(m.input_tokens + m.output_tokens)} tok</span>
                        <span style={{ color: '#e94560' }}>${m.cost_usd.toFixed(4)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── styles ───────────────────────────────────────────────────────────────────

const S = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 300,
  },
  panel: {
    background: '#fff',
    borderRadius: 16,
    width: '95vw', maxWidth: 1000,
    maxHeight: '92vh',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
  },
  header: {
    background: '#1a1a2e',
    color: '#fff',
    padding: '18px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexShrink: 0,
  },
  headerTitle: { fontSize: 20, fontWeight: 700 },
  headerSub:   { fontSize: 13, color: '#a0a0c0', marginTop: 3 },
  closeBtn: {
    background: 'rgba(255,255,255,0.12)',
    border: 'none', borderRadius: 8,
    color: '#fff', cursor: 'pointer',
    fontSize: 18, width: 36, height: 36,
  },
  tabs: {
    display: 'flex', gap: 0,
    borderBottom: '2px solid #eee',
    background: '#fafafa',
    flexShrink: 0,
  },
  tabBtn: {
    padding: '14px 24px',
    background: 'none', border: 'none',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    color: '#777', borderBottom: '2px solid transparent',
    marginBottom: -2,
  },
  tabActive: { color: '#1a1a2e', borderBottom: '2px solid #1a1a2e' },
  body: {
    overflowY: 'auto',
    padding: 24,
    flex: 1,
  },
  loading: { textAlign: 'center', padding: 60, color: '#555' },
  errBox:  { background: '#fff3f5', border: '1px solid #f8c', borderRadius: 8, padding: '14px 18px', color: '#c00' },
  empty:   { color: '#aaa', fontSize: 13, padding: '12px 0' },

  cardRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 14, marginBottom: 28,
  },
  card: {
    background: '#fafafa',
    border: '1px solid #eee',
    borderRadius: 10,
    padding: '16px 18px',
  },
  cardValue: { fontSize: 24, fontWeight: 700, color: '#1a1a2e' },
  cardLabel: { fontSize: 12, color: '#777', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.5px' },
  cardSub:   { fontSize: 11, color: '#aaa', marginTop: 4 },

  sectionHeader: {
    fontSize: 14, fontWeight: 700, color: '#333',
    margin: '22px 0 10px', textTransform: 'uppercase', letterSpacing: '.5px',
  },

  barChart: { display: 'flex', gap: 8, alignItems: 'flex-end', height: 120, marginBottom: 28 },
  barCol:   { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  barLabel: { fontSize: 10, color: '#666' },
  barTrack: { flex: 1, width: '100%', background: '#f0f0f0', borderRadius: 4, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 60 },
  barFill:  { width: '100%', borderRadius: '4px 4px 0 0', transition: 'height .3s' },
  barXLabel:{ fontSize: 10, color: '#999' },

  hBarRow:  { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  hBarLabel:{ width: 140, fontSize: 12, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 },
  hBarTrack:{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  hBarFill: { height: '100%', borderRadius: 4, transition: 'width .3s' },
  hBarVal:  { width: 110, fontSize: 11, color: '#666', textAlign: 'right', flexShrink: 0 },

  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 8 },

  tokenChart: { display: 'flex', gap: 8, alignItems: 'flex-end', height: 130, marginBottom: 28, position: 'relative' },
  tokenCol:   { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  tokenBar:   { flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 60, background: '#f5f5f5', borderRadius: 4, overflow: 'hidden' },
  tokenLegend:{ position: 'absolute', top: -20, right: 0, fontSize: 11, color: '#666' },

  modelRow:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8f8f8', borderRadius: 8, marginBottom: 6 },
  modelName:  { fontSize: 12, fontWeight: 600, color: '#333' },
  modelStats: { display: 'flex', gap: 12, fontSize: 11, color: '#666' },
}
