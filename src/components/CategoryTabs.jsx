import { categories } from '../data/menuData'

export default function CategoryTabs({ active, onChange }) {
  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {categories.map(cat => (
          <button
            key={cat.id}
            style={{
              ...styles.tab,
              ...(active === cat.id ? styles.activeTab : {}),
            }}
            onClick={() => onChange(cat.id)}
          >
            <span style={styles.icon}>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    background: '#fff',
    borderBottom: '1px solid #e8e8e8',
    overflowX: 'auto',
  },
  inner: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    gap: 4,
    whiteSpace: 'nowrap',
  },
  tab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '14px 18px',
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: '#666',
    transition: 'color 0.2s',
    whiteSpace: 'nowrap',
  },
  activeTab: {
    color: '#e94560',
    borderBottom: '3px solid #e94560',
    fontWeight: 600,
  },
  icon: {
    fontSize: 16,
  },
}
