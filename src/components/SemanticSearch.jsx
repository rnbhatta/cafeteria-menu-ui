import { useState, useEffect, useRef } from 'react'
import { menuItems } from '../data/menuData'
import { buildIndex, semanticSearch, itemToText, embedText } from '../utils/embeddings'
import { pca2d } from '../utils/pca'

const EXAMPLES = [
  'Something light and healthy for lunch',
  'High protein meal under 600 calories',
  'Hot drink to go with breakfast',
  'Vegan dessert option',
  'Quick snack with lots of energy',
]

const CAT_COLOR = {
  breakfast: '#f5a623',
  lunch:     '#4a9eff',
  snacks:    '#4caf82',
  beverages: '#9c6fc7',
  desserts:  '#e94560',
}

// ── Star polygon helper ──────────────────────────────────────────────────────
function starPoints(cx, cy, r, n = 5) {
  return Array.from({ length: n * 2 }, (_, i) => {
    const angle  = (i * Math.PI) / n - Math.PI / 2
    const radius = i % 2 === 0 ? r : r * 0.42
    return `${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`
  }).join(' ')
}

// ── 2-D scatter plot ─────────────────────────────────────────────────────────
function EmbeddingMap({ items, pts2d, queryPt, topIds }) {
  const [tip, setTip] = useState(null)
  const W = 560, H = 340, PAD = 44

  const allX = pts2d.map(p => p[0]).concat(queryPt ? [queryPt[0]] : [])
  const allY = pts2d.map(p => p[1]).concat(queryPt ? [queryPt[1]] : [])
  const x0 = Math.min(...allX), x1 = Math.max(...allX)
  const y0 = Math.min(...allY), y1 = Math.max(...allY)
  const rx  = x1 - x0 || 1,    ry  = y1 - y0 || 1

  const sx = x => PAD + ((x - x0) / rx) * (W - 2 * PAD)
  const sy = y => H - PAD - ((y - y0) / ry) * (H - 2 * PAD)

  return (
    <div>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', background: '#f8f8f5', borderRadius: 10, border: '1px solid #eee' }}
        onMouseLeave={() => setTip(null)}
      >
        {/* Dashed lines: query → top matches */}
        {queryPt && items.map((item, i) => topIds.has(item.id) && (
          <line key={item.id}
            x1={sx(queryPt[0])} y1={sy(queryPt[1])}
            x2={sx(pts2d[i][0])} y2={sy(pts2d[i][1])}
            stroke="#1a1a2e" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.25}
          />
        ))}

        {/* Menu item dots */}
        {items.map((item, i) => {
          const cx = sx(pts2d[i][0]), cy = sy(pts2d[i][1])
          const isTop  = topIds.has(item.id)
          const color  = CAT_COLOR[item.category] || '#aaa'
          return (
            <g key={item.id}
              onMouseEnter={() => setTip({ item, cx, cy })}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={cx} cy={cy} r={isTop ? 11 : 7}
                fill={color} opacity={isTop ? 1 : 0.5}
                stroke={isTop ? '#fff' : 'none'} strokeWidth={2}
              />
              <text x={cx + 13} y={cy + 5}
                fontSize={isTop ? 15 : 11}
                fontFamily="sans-serif"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {item.emoji}
              </text>
            </g>
          )
        })}

        {/* Query star */}
        {queryPt && (
          <g>
            <polygon
              points={starPoints(sx(queryPt[0]), sy(queryPt[1]), 13)}
              fill="#1a1a2e" stroke="#fff" strokeWidth={1.5}
            />
            <text
              x={sx(queryPt[0]) + 18} y={sy(queryPt[1]) + 5}
              fontSize={11} fill="#1a1a2e" fontWeight="700"
              fontFamily="sans-serif"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              query ▲
            </text>
          </g>
        )}

        {/* Tooltip */}
        {tip && (() => {
          const tx = tip.cx > W - 160 ? tip.cx - 154 : tip.cx + 14
          return (
            <g>
              <rect x={tx} y={tip.cy - 24} width={148} height={44}
                rx={7} fill="#1a1a2e" opacity={0.93}
              />
              <text x={tx + 10} y={tip.cy - 7}
                fontSize={12} fill="#fff" fontWeight="700"
                fontFamily="sans-serif"
              >
                {tip.item.name}
              </text>
              <text x={tx + 10} y={tip.cy + 10}
                fontSize={11} fill="#a0a0c0" fontFamily="sans-serif"
              >
                {tip.item.category} · ${tip.item.price}
              </text>
            </g>
          )
        })()}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10 }}>
        {Object.entries(CAT_COLOR).map(([cat, color]) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#555' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
            {cat}
          </div>
        ))}
        {/* Query legend entry */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#555' }}>
          <svg width={14} height={14} viewBox="-14 -14 28 28">
            <polygon points={starPoints(0, 0, 12)} fill="#1a1a2e" />
          </svg>
          your query
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SemanticSearch({ onClose }) {
  const [progress, setProgress]       = useState(0)
  const [modelReady, setModelReady]   = useState(false)
  const [query, setQuery]             = useState('')
  const [results, setResults]         = useState([])
  const [searching, setSearching]     = useState(false)
  const [showContext, setShowContext]  = useState(false)
  const [error, setError]             = useState(null)
  const [pts2d, setPts2d]             = useState(null)
  const [queryPt, setQueryPt]         = useState(null)

  const indexRef   = useRef(null)
  const projectRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    buildIndex(menuItems, p => { if (!cancelled) setProgress(p) })
      .then(idx => {
        if (cancelled) return
        indexRef.current = idx
        const { points, project } = pca2d(idx)
        projectRef.current = project
        setPts2d(points)
        setModelReady(true)
      })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [])

  async function runSearch(q) {
    if (!q.trim() || !indexRef.current) return
    setSearching(true)
    setShowContext(false)
    try {
      const [res, qVec] = await Promise.all([
        semanticSearch(q, indexRef.current, menuItems),
        embedText(q),
      ])
      setResults(res)
      setQueryPt(projectRef.current(qVec))
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

  const topIds     = new Set(results.map(r => r.item.id))
  const ragContext = results.map(({ item }) => itemToText(item)).join('\n')

  return (
    <div style={s.overlay}>
      <div style={s.panel}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <span style={{ fontSize: 24 }}>🧠</span>
            <div>
              <h2 style={s.title}>Semantic Menu Search</h2>
              <p style={s.subtitle}>all-MiniLM-L6-v2 · PCA 2D map · cosine similarity · runs in browser</p>
            </div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Model loading */}
        {!modelReady && !error && (
          <div style={s.loadBox}>
            <p style={s.loadLabel}>Loading model + building index… {progress}%</p>
            <div style={s.track}><div style={{ ...s.bar, width: `${progress}%` }} /></div>
            <p style={s.loadHint}>Xenova/all-MiniLM-L6-v2 via jsDelivr · cached after first load</p>
          </div>
        )}

        {error && <div style={{ padding: '20px 24px', color: '#e94560' }}>Failed to load model: {error}</div>}

        {/* Search */}
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
                <button key={ex} style={s.chip} onClick={() => pickExample(ex)}>{ex}</button>
              ))}
            </div>
          </>
        )}

        {/* 2D map */}
        {pts2d && (
          <div style={s.mapSection}>
            <p style={s.sectionLabel}>
              EMBEDDING MAP
              <span style={s.sectionHint}> — each dot is a menu item projected to 2D via PCA{queryPt ? '; ★ is your query' : ''}</span>
            </p>
            <EmbeddingMap
              items={menuItems}
              pts2d={pts2d}
              queryPt={queryPt}
              topIds={topIds}
            />
          </div>
        )}

        {/* Results */}
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

            {showContext && (
              <div style={s.ctxBox}>
                <p style={s.ctxTitle}>📋 RAG context injected into LLM prompt</p>
                <p style={s.ctxSub}>These {results.length} items (ranked by similarity) would be prepended to the system prompt:</p>
                <pre style={s.ctxPre}>{ragContext}</pre>
              </div>
            )}
          </div>
        )}

        {/* How it works */}
        <div style={s.howTo}>
          <p style={s.howTitle}>How it works</p>
          <div style={s.steps}>
            {[
              ['1', 'Embed',     'Each menu item → 384-dim vector via all-MiniLM-L6-v2'],
              ['2', 'PCA',       'All 384 dims projected to 2D for the map (PC1 × PC2)'],
              ['3', 'Query',     'Your question embedded into the same vector space'],
              ['4', 'Rank',      'Cosine similarity scores every item — no keywords needed'],
              ['5', 'RAG',       'Top matches become context injected into the LLM prompt'],
            ].map(([n, title, desc]) => (
              <div key={n} style={s.step}>
                <span style={s.stepNum}>{n}</span>
                <div>
                  <span style={s.stepTitle}>{title}</span>
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
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200,
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    overflowY: 'auto', padding: '40px 16px',
  },
  panel: {
    background: '#fff', borderRadius: 16, width: '100%', maxWidth: 720,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
  },
  header: {
    background: '#1a1a2e', color: '#fff', padding: '20px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  title:    { fontSize: 18, fontWeight: 700, margin: 0 },
  subtitle: { fontSize: 12, color: '#a0a0c0', marginTop: 3 },
  closeBtn: {
    background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
    borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16,
  },
  loadBox:  { padding: '24px 24px 20px', borderBottom: '1px solid #f0f0f0' },
  loadLabel:{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 10 },
  track:    { height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  bar:      { height: '100%', background: 'linear-gradient(90deg,#e94560,#f5a623)', borderRadius: 4, transition: 'width 0.3s ease' },
  loadHint: { fontSize: 12, color: '#999', marginTop: 10 },
  form:     { display: 'flex', gap: 10, padding: '20px 24px 0' },
  input: {
    flex: 1, border: '2px solid #e0e0e0', borderRadius: 10,
    padding: '12px 16px', fontSize: 15, outline: 'none', fontFamily: 'inherit',
  },
  searchBtn: {
    background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 10,
    padding: '12px 22px', fontSize: 15, fontWeight: 600, cursor: 'pointer', minWidth: 80,
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 24px 20px' },
  chip: {
    background: '#f5f5f0', border: '1px solid #e0e0e0', borderRadius: 20,
    padding: '6px 14px', fontSize: 12.5, cursor: 'pointer', color: '#555', fontFamily: 'inherit',
  },
  mapSection: { padding: '0 24px 20px', borderBottom: '1px solid #f0f0f0' },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#bbb', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  sectionHint:  { fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#bbb' },
  results: { padding: '0 24px 24px' },
  resultsHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14, borderTop: '1px solid #f0f0f0', paddingTop: 20,
  },
  resultsTitle: { fontSize: 14, fontWeight: 600, color: '#333' },
  ctxToggle: {
    background: '#f5f5f0', border: '1px solid #e0e0e0', borderRadius: 8,
    padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#555',
  },
  card:    { display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid #f5f5f5' },
  emoji:   { fontSize: 32, lineHeight: 1, flexShrink: 0 },
  info:    { flex: 1, minWidth: 0 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  name:    { fontWeight: 600, fontSize: 15, color: '#1a1a2e' },
  price:   { fontWeight: 600, color: '#4caf82', fontSize: 14 },
  desc:    { fontSize: 13, color: '#666', marginBottom: 8, lineHeight: 1.4 },
  scoreRow:  { display: 'flex', alignItems: 'center', gap: 10 },
  scoreTrack:{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' },
  scoreBar:  { height: '100%', background: 'linear-gradient(90deg,#4caf82,#a8e6c4)', borderRadius: 3, transition: 'width 0.4s ease' },
  scoreLabel:{ fontSize: 12, color: '#4caf82', fontWeight: 600, whiteSpace: 'nowrap' },
  ctxBox:  { marginTop: 20, background: '#1a1a2e', borderRadius: 12, padding: '16px 18px', color: '#fff' },
  ctxTitle:{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#fff' },
  ctxSub:  { fontSize: 12, color: '#a0a0c0', marginBottom: 12, lineHeight: 1.5 },
  ctxPre:  { fontSize: 11.5, color: '#e0e0e0', whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.6, margin: 0 },
  howTo:   { background: '#fafaf8', borderTop: '1px solid #f0f0f0', padding: '20px 24px' },
  howTitle:{ fontSize: 11, fontWeight: 700, color: '#bbb', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 },
  steps:   { display: 'flex', flexDirection: 'column', gap: 10 },
  step:    { display: 'flex', alignItems: 'flex-start', gap: 12 },
  stepNum: {
    background: '#1a1a2e', color: '#fff', borderRadius: '50%',
    width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  stepTitle: { fontSize: 13, fontWeight: 700, color: '#1a1a2e' },
  stepDesc:  { fontSize: 13, color: '#666' },
}
