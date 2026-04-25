export default function SearchBar({ value, onChange }) {
  return (
    <div style={styles.wrapper}>
      <span style={styles.icon}>🔍</span>
      <input
        style={styles.input}
        type="text"
        placeholder="Search menu items..."
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button style={styles.clearBtn} onClick={() => onChange('')}>✕</button>
      )}
    </div>
  )
}

const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    background: '#fff',
    borderRadius: 12,
    padding: '0 14px',
    border: '1.5px solid #e8e8e8',
    gap: 10,
    flex: 1,
    maxWidth: 420,
  },
  icon: {
    fontSize: 16,
    flexShrink: 0,
  },
  input: {
    border: 'none',
    outline: 'none',
    fontSize: 15,
    padding: '12px 0',
    flex: 1,
    background: 'transparent',
    fontFamily: 'inherit',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#999',
    fontSize: 13,
    padding: 4,
  },
}
