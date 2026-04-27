import { useState } from 'react'
import { useCart } from './context/CartContext'
import { useMenuFilter } from './hooks/useMenuFilter'
import Header from './components/Header'
import CategoryTabs from './components/CategoryTabs'
import MenuCard from './components/MenuCard'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import SearchBar from './components/SearchBar'
import QueryInterface from './components/QueryInterface'
import AgentChat from './components/AgentChat'

export default function App() {
  const { cartOpen, checkoutOpen } = useCart()
  const { filtered, loading, error, activeCategory, setActiveCategory, search, setSearch, dietFilter, setDietFilter } = useMenuFilter()
  const [queryOpen, setQueryOpen] = useState(false)
  const [agentOpen, setAgentOpen] = useState(false)

  return (
    <div>
      <Header onOpenQuery={() => setQueryOpen(true)} onOpenAgent={() => setAgentOpen(true)} />
      <CategoryTabs active={activeCategory} onChange={setActiveCategory} />

      <main style={styles.main}>
        <div style={styles.toolbar}>
          <SearchBar value={search} onChange={setSearch} />
          <div style={styles.filters}>
            {['', 'vegetarian', 'vegan', 'healthy', 'gluten-free'].map(f => (
              <button
                key={f || 'all'}
                style={{ ...styles.filterBtn, ...(dietFilter === f ? styles.activeFilter : {}) }}
                onClick={() => setDietFilter(f)}
              >
                {f || 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={styles.noResults}>
            <span style={{ fontSize: 48 }}>⏳</span>
            <p style={{ fontSize: 18, fontWeight: 600, marginTop: 12 }}>Loading menu...</p>
          </div>
        ) : error ? (
          <div style={styles.noResults}>
            <span style={{ fontSize: 48 }}>⚠️</span>
            <p style={{ fontSize: 18, fontWeight: 600, marginTop: 12 }}>Could not load menu</p>
            <p style={{ color: '#999', marginTop: 6 }}>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.noResults}>
            <span style={{ fontSize: 48 }}>🔍</span>
            <p style={{ fontSize: 18, fontWeight: 600, marginTop: 12 }}>No items found</p>
            <p style={{ color: '#999', marginTop: 6 }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map(item => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>

      {cartOpen && !checkoutOpen && <Cart />}
      {checkoutOpen && <Checkout />}
      {queryOpen && <QueryInterface onClose={() => setQueryOpen(false)} />}
      {agentOpen && <AgentChat onClose={() => setAgentOpen(false)} />}
    </div>
  )
}

const styles = {
  main: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '28px 24px 60px',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
    flexWrap: 'wrap',
  },
  filters: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterBtn: {
    background: '#fff',
    border: '1.5px solid #e0e0e0',
    borderRadius: 20,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    color: '#555',
    transition: 'all 0.15s',
    textTransform: 'capitalize',
  },
  activeFilter: {
    background: '#1a1a2e',
    color: '#fff',
    border: '1.5px solid #1a1a2e',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 20,
  },
  noResults: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#333',
  },
}
