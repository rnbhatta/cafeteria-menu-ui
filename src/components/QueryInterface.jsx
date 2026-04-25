import { useState } from 'react'

const EXAMPLES = [
  'Show all vegan items',
  'What are the most popular items?',
  'List all breakfast items under $7',
  'Which items have the highest rating?',
  'Show all orders placed today',
  'Count items in each category',
  'What is the average price of lunch items?',
  'Show gluten-free beverages',
]

export default function QueryInterface({ onClose }) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [showQuery, setShowQuery] = useState(false)
  const [history, setHistory] = useState([])

  async function handleSubmit(q) {
    const text = (q || question).trim()
    if (!text) return
    setLoading(true)
    setError(null)
    setResult(null)
    setShowQuery(false)
    try {
      const res = await fetch('/api/query/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      })
      let data
      try {
        data = await res.json()
      } catch {
        throw new Error(`Server error (${res.status}). Check that your ANTHROPIC_API_KEY is set in backend/.env`)
      }
      if (!res.ok) throw new Error(data.detail || `Request failed (${res.status})`)
      setResult(data)
      setHistory(prev => [{ question: text, count: data.count }, ...prev.slice(0, 9)])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function useExample(ex) {
    setQuestion(ex)
    handleSubmit(ex)
  }

  const columns = result?.results?.length > 0
    ? Object.keys(result.results[0]).filter(k => k !== '_id')
    : []

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <aside style={styles.panel}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Query Database</h2>
            <p style={styles.subtitle}>Ask anything in plain English</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.body}>
          <div style={styles.inputRow}>
            <input
              style={styles.input}
              placeholder="e.g. Show all vegan items under $6"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
            <button
              style={{ ...styles.askBtn, opacity: loading ? 0.7 : 1 }}
              onClick={() => handleSubmit()}
              disabled={loading}
            >
              {loading ? '...' : 'Ask'}
            </button>
          </div>

          <div style={styles.examples}>
            {EXAMPLES.map(ex => (
              <button key={ex} style={styles.chip} onClick={() => useExample(ex)}>
                {ex}
              </button>
            ))}
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <p style={{ fontSize: 14 }}>{error}</p>
            </div>
          )}

          {loading && (
            <div style={styles.loadingBox}>
              <div style={styles.spinner} />
              <p style={{ fontSize: 14, color: '#666' }}>Generating query...</p>
            </div>
          )}

          {result && !loading && (
            <div style={styles.results}>
              <div style={styles.resultsMeta}>
                <span style={styles.resultsCount}>{result.count} result{result.count !== 1 ? 's' : ''}</span>
                <button style={styles.toggleQuery} onClick={() => setShowQuery(v => !v)}>
                  {showQuery ? 'Hide' : 'Show'} MongoDB query
                </button>
              </div>

              {showQuery && (
                <pre style={styles.queryBox}>
                  {JSON.stringify(result.query, null, 2)}
                </pre>
              )}

              {result.results.length === 0 ? (
                <p style={{ color: '#999', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>No results found.</p>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {columns.map(col => (
                          <th key={col} style={styles.th}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.results.map((row, i) => (
                        <tr key={i} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                          {columns.map(col => (
                            <td key={col} style={styles.td}>
                              {formatCell(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {history.length > 0 && !loading && (
            <div style={styles.historySection}>
              <p style={styles.historyTitle}>Recent queries</p>
              {history.map((h, i) => (
                <button key={i} style={styles.historyItem} onClick={() => useExample(h.question)}>
                  <span style={{ flex: 1, textAlign: 'left' }}>{h.question}</span>
                  <span style={styles.historyCount}>{h.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

function formatCell(val) {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (Array.isArray(val)) return val.join(', ') || '—'
  if (typeof val === 'object') {
    if (val.$date) return new Date(val.$date).toLocaleString()
    return JSON.stringify(val)
  }
  if (typeof val === 'number') return Number.isInteger(val) ? val : val.toFixed(2)
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return new Date(val).toLocaleString()
  }
  return String(val)
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 },
  panel: {
    position: 'fixed', top: 0, right: 0, bottom: 0,
    width: 680, maxWidth: '100vw',
    background: '#fff', zIndex: 201,
    display: 'flex', flexDirection: 'column',
    boxShadow: '-4px 0 32px rgba(0,0,0,0.18)',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '20px 24px', borderBottom: '1px solid #f0f0f0',
    background: '#1a1a2e', color: '#fff',
  },
  title: { fontSize: 20, fontWeight: 700 },
  subtitle: { fontSize: 13, color: '#a0a0c0', marginTop: 3 },
  closeBtn: {
    background: 'rgba(255,255,255,0.15)', border: 'none', width: 36, height: 36,
    borderRadius: '50%', fontSize: 15, cursor: 'pointer', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  body: { flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 },
  inputRow: { display: 'flex', gap: 10 },
  input: {
    flex: 1, border: '2px solid #1a1a2e', borderRadius: 10,
    padding: '12px 16px', fontSize: 15, outline: 'none', fontFamily: 'inherit',
  },
  askBtn: {
    background: '#e94560', color: '#fff', border: 'none',
    borderRadius: 10, padding: '12px 22px', fontSize: 15,
    fontWeight: 700, cursor: 'pointer', flexShrink: 0,
  },
  examples: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: {
    background: '#f5f5f0', border: '1.5px solid #e0e0e0', borderRadius: 20,
    padding: '6px 14px', fontSize: 13, cursor: 'pointer', color: '#444',
    fontFamily: 'inherit',
  },
  errorBox: {
    background: '#fff5f6', border: '1.5px solid #fca5a5', borderRadius: 10,
    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, color: '#c0392b',
  },
  loadingBox: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '20px 0', justifyContent: 'center',
  },
  spinner: {
    width: 22, height: 22, border: '3px solid #e0e0e0',
    borderTop: '3px solid #e94560', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  results: { display: 'flex', flexDirection: 'column', gap: 12 },
  resultsMeta: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  resultsCount: {
    background: '#1a1a2e', color: '#fff',
    padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
  },
  toggleQuery: {
    background: 'none', border: '1.5px solid #e0e0e0', borderRadius: 8,
    padding: '4px 12px', fontSize: 12, cursor: 'pointer', color: '#666', fontFamily: 'inherit',
  },
  queryBox: {
    background: '#1e1e2e', color: '#a0e0a0', borderRadius: 10,
    padding: '14px 16px', fontSize: 12, overflowX: 'auto',
    fontFamily: 'monospace', margin: 0,
  },
  tableWrapper: { overflowX: 'auto', borderRadius: 10, border: '1px solid #e8e8e8' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    background: '#1a1a2e', color: '#fff',
    padding: '10px 14px', textAlign: 'left',
    fontWeight: 600, whiteSpace: 'nowrap',
  },
  trEven: { background: '#fff' },
  trOdd: { background: '#fafaf8' },
  td: {
    padding: '9px 14px', borderBottom: '1px solid #f0f0f0',
    color: '#333', maxWidth: 220, overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  historySection: { borderTop: '1px solid #f0f0f0', paddingTop: 12 },
  historyTitle: { fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 },
  historyItem: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    background: 'none', border: '1px solid #efefef', borderRadius: 8,
    padding: '8px 12px', fontSize: 13, cursor: 'pointer',
    color: '#444', marginBottom: 6, fontFamily: 'inherit',
  },
  historyCount: {
    background: '#f0f0f0', borderRadius: 10,
    padding: '2px 8px', fontSize: 12, color: '#666', flexShrink: 0,
  },
}
