import { useState, useEffect, useRef } from 'react'
import { menuItems } from '../data/menuData'
import { buildIndex, semanticSearch, itemToText } from '../utils/embeddings'

const EXAMPLES = [
  'Something light and healthy for lunch',
  'High protein meal under 600 calories',
  'Hot drink to go with breakfast',
  'Vegan dessert option',
  'Quick snack with lots of energy',
]

export default function SemanticSearch({ onClose }) {
  const [progress, setProgress]     = useState(0)
  const [modelReady, setModelReady] = useState(false)
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState([])
  const [searching, setSearching]   = useState(false)
  const [showContext, setShowContext] = useState(false)
  const [error, setError]           = useState(null)
  const indexRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    buildIndex(menuItems, p => { if (!cancelled) setProgress(p) })
      .then(idx => {
        if (!cancelled) { indexRef.current = idx; setModelReady(true) }
      })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [])

  async function runSearch(q) {
    if (!q.trim() || !indexRef.current) return
    setSearching(true)
    try {
      const res = await semanticSearch(q, indexRef.current, menuItems)
      setResults(res)
      setShowContext(false)
    } finally {
      setSearching(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    runSearch(query)
  }

  function pickExample(ex) {
    setQuery(ex)
    runSearch(ex)
  }

  const ragContext = results.map(({ item }) => itemToText(item)).join('\n')

  return (
    <div style={s.overlay}>
      <div style={s.panel}>

        {/* ── Header ── */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <span style={{ fontSize: 26 }}>🧠</span>
            <div>
              <h2 style={s.title}>Semantic Menu Search</h2>
              <p style={s.subtitle}>all-MiniLM-L6-v2 · cosine similarity · runs in your browser</p>
            </div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* ── Model loading ── */}
        {!modelReady && !error && (
          <div style={s.loadBox}>
            <p style={s.loadLabel}>Loading embedding model… {progress}%</p>
            <div style={s.track}>
              <div style={{ ...s.bar, width: `${progress}%` }} />
            </div>
            <p style={s.loadHint}>
              Downloading Xenova/all-MiniLM-L6-v2 (~22 MB) and building the menu index.
              This happens once — your browser caches it after the first load.
            </p>
          </div>
        )}

        {error && (
          <div style={{ padding: '20px 24px', color: '#e94560' }}>
            Failed to load model: {error}
          </div>
        )}

        {/* ── Search ── */}
        {modelReady && (
          <>
            <form onSubmit={handleSubmit} style={s.form}>
              <input
                style={s.input}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Describe what you're looking for…"
                autoFocus
              />
              <button style={s.searchBtn} type="submit" disabled={searching}>
                {searching ? '…' : 'Search'}
              </button>
            </form>

            <div style={s.chips}>
              {EXAMPLES.map(ex => (
                <button key={ex} style={s.chip} onClick={() => pickExample(ex)}>
                  {ex}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Results ── */}
        {results.length > 0 && (
          <div style={s.results}>
            <div style={s.resultsHeader}>
              <span style={s.resultsTitle}>Top {results.length} semantic matches</span>
              <button style={s.ctxToggle} onClick={() => setShowContext(v => !v)}>
                {showContext ? 'Hide' : 'Show'} RAG context
              </button>
            </div>

            {results.map(({ item, score }) => (
              <div key={item.id} style={s.card}>
                <span style={s.emoji}>{item.emoji}</span>
                <div style={s.info}>
                  <div style={s.cardTop}>
                    <span style={s.name}>{item.name}</span>
                    <span style={s.price}>${item.price.toFixed(2)}</span>
                  </div>
                  <p style={s.desc}>{item.description}</p>
                  <div style={s.scoreRow}>
                    <div style={s.scoreTrack}>
                      <div style={{ ...s.scoreBar, width: `${(score * 100).toFixed(1)}%` }} />
                    </div>
                    <span style={s.scoreLabel}>{(score * 100).toFixed(1)}% match</span>
                  </div>
                </div>
              </div>
            ))}

            {/* RAG context preview */}
            {showContext && (
              <div style={s.ctxBox}>
                <p style={s.ctxTitle}>📋 RAG Context injected into the LLM prompt</p>
                <p style={s.ctxSub}>
                  These {results.length} items (ranked by semantic similarity) would be
                  prepended to the system prompt so the LLM can answer with grounded facts:
                </p>
                <pre style={s.ctxPre}>{ragContext}</pre>
              </div>
            )}
          </div>
        )}

        {/* ── How it works ── */}
        <div style={s.howTo}>
          <p style={s.howTitle}>How it works</p>
          <div style={s.steps}>
            {[
              ['1', 'Embed', 'Each menu item is converted to a 384-dim vector using all-MiniLM-L6-v2'],
              ['2', 'Query', 'Your question is embedded into the same vector space'],
              ['3', 'Rank', 'Cosine similarity ranks items by semantic closeness — no keywords needed'],
              ['4', 'RAG', 'Top matches become the context window injected into the LLM prompt'],
            ].map(([num, step, desc]) => (
              <div key={num} style={s.step}>
                <span style={s.stepNum}>{num}</span>
                <div>
                  <span style={s.stepTitle}>{step}</span>
                  <span style={s.stepDesc}> — {desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.55)',
    zIndex: 200,
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    overflowY: 'auto', padding: '40px 16px',
  },
  panel: {
    background: '#fff', borderRadius: 16,
    width: '100%', maxWidth: 700,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  header: {
    background: '#1a1a2e', color: '#fff',
    padding: '20px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  title: { fontSize: 18, fontWeight: 700, margin: 0 },
  subtitle: { fontSize: 12, color: '#a0a0c0', marginTop: 3 },
  closeBtn: {
    background: 'rgba(255,255,255,0.15)', border: 'none',
    color: '#fff', borderRadius: 8, width: 32, height: 32,
    cursor: 'pointer', fontSize: 16,
  },
  loadBox: { padding: '24px 24px 20px', borderBottom: '1px solid #f0f0f0' },
  loadLabel: { fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 10 },
  track: { height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  bar: {
    height: '100%',
    background: 'linear-gradient(90deg, #e94560, #f5a623)',
    borderRadius: 4, transition: 'width 0.3s ease',
  },
  loadHint: { fontSize: 12, color: '#999', marginTop: 10, lineHeight: 1.5 },
  form: { display: 'flex', gap: 10, padding: '20px 24px 0' },
  input: {
    flex: 1, border: '2px solid #e0e0e0', borderRadius: 10,
    padding: '12px 16px', fontSize: 15, outline: 'none', fontFamily: 'inherit',
  },
  searchBtn: {
    background: '#1a1a2e', color: '#fff', border: 'none',
    borderRadius: 10, padding: '12px 22px', fontSize: 15,
    fontWeight: 600, cursor: 'pointer', minWidth: 80,
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 24px 20px' },
  chip: {
    background: '#f5f5f0', border: '1px solid #e0e0e0', borderRadius: 20,
    padding: '6px 14px', fontSize: 12.5, cursor: 'pointer',
    color: '#555', fontFamily: 'inherit',
  },
  results: { padding: '0 24px 24px' },
  resultsHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14, borderTop: '1px solid #f0f0f0', paddingTop: 20,
  },
  resultsTitle: { fontSize: 14, fontWeight: 600, color: '#333' },
  ctxToggle: {
    background: '#f5f5f0', border: '1px solid #e0e0e0', borderRadius: 8,
    padding: '6px 14px', fontSize: 13, cursor: 'pointer',
    fontFamily: 'inherit', color: '#555',
  },
  card: {
    display: 'flex', gap: 14, padding: '14px 0',
    borderBottom: '1px solid #f5f5f5',
  },
  emoji: { fontSize: 32, lineHeight: 1, flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  cardTop: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'baseline', marginBottom: 4,
  },
  name: { fontWeight: 600, fontSize: 15, color: '#1a1a2e' },
  price: { fontWeight: 600, color: '#4caf82', fontSize: 14 },
  desc: { fontSize: 13, color: '#666', marginBottom: 8, lineHeight: 1.4 },
  scoreRow: { display: 'flex', alignItems: 'center', gap: 10 },
  scoreTrack: {
    flex: 1, height: 6, background: '#f0f0f0',
    borderRadius: 3, overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #4caf82, #a8e6c4)',
    borderRadius: 3, transition: 'width 0.4s ease',
  },
  scoreLabel: { fontSize: 12, color: '#4caf82', fontWeight: 600, whiteSpace: 'nowrap' },
  ctxBox: {
    marginTop: 20, background: '#1a1a2e',
    borderRadius: 12, padding: '16px 18px', color: '#fff',
  },
  ctxTitle: { fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#fff' },
  ctxSub: { fontSize: 12, color: '#a0a0c0', marginBottom: 12, lineHeight: 1.5 },
  ctxPre: {
    fontSize: 11.5, color: '#e0e0e0', whiteSpace: 'pre-wrap',
    fontFamily: 'monospace', lineHeight: 1.6, margin: 0,
  },
  howTo: {
    background: '#fafaf8', borderTop: '1px solid #f0f0f0',
    padding: '20px 24px',
  },
  howTitle: { fontSize: 13, fontWeight: 700, color: '#999', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 },
  steps: { display: 'flex', flexDirection: 'column', gap: 10 },
  step: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  stepNum: {
    background: '#1a1a2e', color: '#fff',
    borderRadius: '50%', width: 22, height: 22,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  stepTitle: { fontSize: 13, fontWeight: 700, color: '#1a1a2e' },
  stepDesc: { fontSize: 13, color: '#666' },
}
