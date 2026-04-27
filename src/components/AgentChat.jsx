import { useState, useRef, useEffect } from 'react'
import { agentChat } from '../services/api'

const SUGGESTIONS = [
  "What's popular today?",
  'Show me vegan options',
  'What can I get under $6?',
  'Recommend a healthy lunch',
  'Any gluten-free snacks?',
  "What's the highest rated breakfast item?",
]

export default function AgentChat({ onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function send(text) {
    const content = (text || input).trim()
    if (!content || loading) return

    const userMessage = { role: 'user', content }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const data = await agentChat(nextMessages)
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      let msg = err.message
      try {
        const parsed = JSON.parse(msg)
        msg = parsed.detail || msg
      } catch {}
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <aside style={styles.panel}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.avatar}>🤖</div>
            <div>
              <h2 style={styles.title}>Cafeteria Assistant</h2>
              <p style={styles.subtitle}>Ask me anything about the menu</p>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.body}>
          {messages.length === 0 && !loading && (
            <div style={styles.welcome}>
              <p style={styles.welcomeText}>
                Hi! I can help you find the perfect meal, check dietary options, or look up your order status.
              </p>
              <div style={styles.suggestions}>
                {SUGGESTIONS.map(s => (
                  <button key={s} style={styles.suggestionChip} onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={msg.role === 'user' ? styles.userRow : styles.assistantRow}>
              {msg.role === 'assistant' && <div style={styles.botAvatar}>🤖</div>}
              <div style={msg.role === 'user' ? styles.userBubble : styles.assistantBubble}>
                <MessageContent content={msg.content} />
              </div>
            </div>
          ))}

          {loading && (
            <div style={styles.assistantRow}>
              <div style={styles.botAvatar}>🤖</div>
              <div style={styles.assistantBubble}>
                <TypingDots />
              </div>
            </div>
          )}

          {error && (
            <div style={styles.errorBox}>
              <span>⚠️</span>
              <span style={{ fontSize: 13 }}>{error}</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div style={styles.inputArea}>
          <textarea
            ref={inputRef}
            style={styles.textarea}
            placeholder="Ask about the menu..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
          />
          <button
            style={{ ...styles.sendBtn, opacity: loading || !input.trim() ? 0.5 : 1 }}
            onClick={() => send()}
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </div>
      </aside>
    </>
  )
}

function MessageContent({ content }) {
  const lines = content.split('\n')
  return (
    <div style={{ fontSize: 14, lineHeight: 1.6 }}>
      {lines.map((line, i) => (
        <p key={i} style={{ margin: i === 0 ? 0 : '6px 0 0' }}>
          {line || <>&nbsp;</>}
        </p>
      ))}
    </div>
  )
}

function TypingDots() {
  return (
    <div style={styles.dots}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ ...styles.dot, animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  )
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 },
  panel: {
    position: 'fixed', top: 0, right: 0, bottom: 0,
    width: 440, maxWidth: '100vw',
    background: '#fff', zIndex: 201,
    display: 'flex', flexDirection: 'column',
    boxShadow: '-4px 0 32px rgba(0,0,0,0.18)',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid #f0f0f0',
    background: '#1a1a2e', color: '#fff', flexShrink: 0,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'rgba(233,69,96,0.9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20,
  },
  title: { fontSize: 16, fontWeight: 700, margin: 0 },
  subtitle: { fontSize: 12, color: '#a0a0c0', margin: '2px 0 0' },
  closeBtn: {
    background: 'rgba(255,255,255,0.15)', border: 'none', width: 34, height: 34,
    borderRadius: '50%', fontSize: 14, cursor: 'pointer', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  body: {
    flex: 1, overflowY: 'auto', padding: '16px 16px 8px',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  welcome: { padding: '8px 0' },
  welcomeText: { fontSize: 14, color: '#555', lineHeight: 1.5, marginBottom: 16 },
  suggestions: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  suggestionChip: {
    background: '#f5f5f0', border: '1.5px solid #e0e0e0', borderRadius: 20,
    padding: '7px 14px', fontSize: 13, cursor: 'pointer', color: '#333',
    fontFamily: 'inherit', transition: 'border-color 0.15s',
  },
  userRow: { display: 'flex', justifyContent: 'flex-end' },
  assistantRow: { display: 'flex', alignItems: 'flex-start', gap: 8 },
  botAvatar: {
    width: 30, height: 30, borderRadius: '50%',
    background: '#1a1a2e', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 14, flexShrink: 0,
  },
  userBubble: {
    background: '#1a1a2e', color: '#fff',
    borderRadius: '18px 18px 4px 18px',
    padding: '10px 14px', maxWidth: '78%',
  },
  assistantBubble: {
    background: '#f5f5f0', color: '#1a1a1a',
    borderRadius: '18px 18px 18px 4px',
    padding: '10px 14px', maxWidth: '78%',
  },
  errorBox: {
    background: '#fff5f6', border: '1.5px solid #fca5a5',
    borderRadius: 10, padding: '10px 14px',
    display: 'flex', alignItems: 'center', gap: 8, color: '#c0392b',
  },
  inputArea: {
    display: 'flex', gap: 8, padding: '12px 16px',
    borderTop: '1px solid #f0f0f0', flexShrink: 0,
    background: '#fff',
  },
  textarea: {
    flex: 1, border: '2px solid #e0e0e0', borderRadius: 12,
    padding: '10px 14px', fontSize: 14, outline: 'none',
    fontFamily: 'inherit', resize: 'none', lineHeight: 1.4,
    transition: 'border-color 0.15s',
  },
  sendBtn: {
    background: '#e94560', color: '#fff', border: 'none',
    borderRadius: 12, padding: '10px 18px', fontSize: 14,
    fontWeight: 700, cursor: 'pointer', flexShrink: 0, alignSelf: 'flex-end',
  },
  dots: { display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' },
  dot: {
    width: 8, height: 8, borderRadius: '50%',
    background: '#aaa', display: 'inline-block',
    animation: 'pulse 1.2s ease-in-out infinite',
  },
}
